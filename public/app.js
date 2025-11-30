document.getElementById("searchForm").addEventListener("submit", async (event) => {
  event.preventDefault();

  const hometown = document.getElementById("hometown").value.trim();
  const radius = document.getElementById("radius").value || 20;
  const jobType = document.getElementById("jobType").value;
  const minSalary = document.getElementById("minSalary").value;

  const resultsDiv = document.getElementById("results");
  const submitButton = event.target.querySelector("button[type='submit']");
  
  // Disable button and show loading
  submitButton.disabled = true;
  submitButton.textContent = "Searching...";
  resultsDiv.innerHTML = "<p class='loading'>🔍 Searching for jobs near you...</p>";

  try {
    // Create timeout controller for older browsers
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout
    
    // Call backend Gemini endpoint
    const response = await fetch("/api/ai-jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hometown, radius, jobType, minSalary }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    // Check if response is ok before parsing
    if (!response.ok) {
      let errorMessage = "An error occurred";
      let errorDetails = "";
      
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || `Server error (${response.status})`;
        errorDetails = errorData.details || "";
      } catch (e) {
        errorMessage = `Server error (${response.status})`;
        errorDetails = response.statusText || "Please try again";
      }
      
      resultsDiv.innerHTML = `
        <div class="error-message">
          <p><strong>❌ ${escapeHtml(errorMessage)}</strong></p>
          ${errorDetails ? `<p class="error-details">${escapeHtml(errorDetails)}</p>` : ""}
          ${errorMessage.includes("API key") ? `
            <p class="error-help">Please configure your Gemini API key in the .env file</p>
          ` : ""}
        </div>
      `;
      return;
    }

    // Parse JSON response safely
    let data;
    const responseText = await response.text();
    
    if (!responseText || responseText.trim() === "") {
      throw new Error("Empty response from server");
    }
    
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error("JSON Parse Error:", parseError, "Response:", responseText.substring(0, 200));
      resultsDiv.innerHTML = `
        <div class="error-message">
          <p><strong>❌ Invalid response from server</strong></p>
          <p class="error-details">The server returned invalid data. Please try again.</p>
        </div>
      `;
      return;
    }

    resultsDiv.innerHTML = "";

    // Handle errors in response data
    if (data.error) {
      let errorMessage = data.error || "An error occurred";
      let errorDetails = data.details || "";
      
      resultsDiv.innerHTML = `
        <div class="error-message">
          <p><strong>❌ ${escapeHtml(errorMessage)}</strong></p>
          ${errorDetails ? `<p class="error-details">${escapeHtml(errorDetails)}</p>` : ""}
          ${errorMessage.includes("API key") ? `
            <p class="error-help">Please configure your Gemini API key in the .env file</p>
          ` : ""}
        </div>
      `;
      return;
    }

    // Check if it's an array (successful response)
    if (!Array.isArray(data)) {
      resultsDiv.innerHTML = `
        <div class="error-message">
          <p><strong>⚠️ Unexpected response format</strong></p>
          <p>Please try again</p>
        </div>
      `;
      return;
    }

    // Handle empty results
    if (data.length === 0) {
      resultsDiv.innerHTML = `
        <div class="no-results">
          <p>😔 No jobs found matching your criteria</p>
          <p class="suggestion">Try:</p>
          <ul>
            <li>Expanding your search radius</li>
            <li>Adjusting the minimum salary</li>
            <li>Selecting a different job type</li>
          </ul>
        </div>
      `;
      return;
    }

    // Display jobs
    data.forEach((job, index) => {
      const card = document.createElement("div");
      card.className = "job-card";
      
      const formattedSalary = new Intl.NumberFormat('en-IN').format(job.salary || 0);
      
      // Validate and sanitize apply URL
      let applyUrl = job.applyUrl || '';
      const isValidUrl = applyUrl && (applyUrl.startsWith('http://') || applyUrl.startsWith('https://'));
      
      // If no valid URL, create a fallback search URL
      if (!isValidUrl) {
        const searchQuery = encodeURIComponent(`${job.title} ${job.location} ${job.company}`);
        applyUrl = `https://www.google.com/search?q=${searchQuery}+job+apply`;
      }

      card.innerHTML = `
        <div class="job-header">
          <h3>${escapeHtml(job.title || "Job Title")}</h3>
          <span class="job-type-tag">${escapeHtml(job.jobType || jobType || "Full-time")}</span>
        </div>
        <p class="company-name"><strong>🏢 Company:</strong> ${escapeHtml(job.company || "Company Name")}</p>
        <p class="job-location"><strong>📍 Location:</strong> ${escapeHtml(job.location || hometown)}</p>
        <p class="job-salary"><strong>💰 Salary:</strong> ₹${formattedSalary}/month</p>
        ${job.description ? `<p class="job-description">${escapeHtml(job.description)}</p>` : ""}
        <button class="apply-btn" data-apply-url="${escapeHtml(applyUrl)}" ${!isValidUrl ? 'title="Redirecting to job search"' : 'title="Apply for this job"'}">
          ${isValidUrl ? 'Apply Now' : 'Find Application'}
        </button>
      `;

      // Add click event listener for apply button
      const applyBtn = card.querySelector('.apply-btn');
      applyBtn.addEventListener('click', function() {
        const url = this.getAttribute('data-apply-url');
        if (url) {
          // Open in new tab
          window.open(url, '_blank', 'noopener,noreferrer');
          
          // Optional: Track the click (for analytics)
          console.log('Apply clicked for:', job.title, 'at', job.company);
        }
      });

      resultsDiv.appendChild(card);
    });

    // Show results count
    const countDiv = document.createElement("div");
    countDiv.className = "results-count";
    countDiv.innerHTML = `<p>✨ Found ${data.length} job${data.length !== 1 ? 's' : ''} near ${escapeHtml(hometown)}</p>`;
    resultsDiv.insertBefore(countDiv, resultsDiv.firstChild);

  } catch (error) {
    console.error("Error:", error);
    
    let errorMessage = "Network Error";
    let errorDetails = "Could not connect to the server.";
    
    if (error.name === "AbortError" || error.name === "TimeoutError" || error.message.includes("aborted")) {
      errorMessage = "Request Timeout";
      errorDetails = "The request took too long. Please try again with a smaller search radius.";
    } else if (error.name === "TypeError" && (error.message.includes("fetch") || error.message.includes("Failed to fetch"))) {
      errorMessage = "Connection Error";
      errorDetails = "Could not reach the server. Make sure the server is running on port 3000.";
    } else if (error.message) {
      errorDetails = error.message;
    }
    
    resultsDiv.innerHTML = `
      <div class="error-message">
        <p><strong>❌ ${escapeHtml(errorMessage)}</strong></p>
        <p>${escapeHtml(errorDetails)}</p>
        <p class="error-help">💡 Make sure the server is running: <code>npm start</code></p>
      </div>
    `;
  } finally {
    // Re-enable button
    submitButton.disabled = false;
    submitButton.textContent = "Search Jobs";
  }
});

// Helper function to escape HTML
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}
