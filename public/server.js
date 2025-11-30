require("dotenv").config();
const express = require("express");
const path = require("path");
const cors = require("cors");
const fetch = require("node-fetch");

const app = express();
const PORT = process.env.PORT || 3000;

// --------------------------
// 🔹 GEMINI API KEY FROM ENVIRONMENT
// --------------------------
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error("⚠️  WARNING: GEMINI_API_KEY not found in environment variables!");
  console.error("   Please create a .env file with: GEMINI_API_KEY=your_api_key_here");
}

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Middleware Error:", err);
  res.status(500).json({
    error: "Server error",
    details: err.message || "An unexpected error occurred",
    jobs: []
  });
});

// Haversine distance calculation (fixed bug)
function distanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in kilometers
  const toRad = (v) => (v * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// -------------------------------
// 🔥 GEMINI API ENDPOINT FOR JOB SEARCH
// -------------------------------
app.post("/api/ai-jobs", async (req, res) => {
  const { hometown, radius, jobType, minSalary } = req.body;

  // Validation
  if (!hometown || hometown.trim() === "") {
    return res.status(400).json({ error: "Hometown is required" });
  }

  if (!GEMINI_API_KEY) {
    return res.status(500).json({ 
      error: "Server configuration error: Gemini API key not set" 
    });
  }

  try {
    // Construct a detailed prompt for Gemini
    const prompt = `You are a job search assistant. Generate realistic job listings for locations near ${hometown}, India.

Requirements:
- Generate exactly 10 job listings
- All jobs must be within ${radius || 20} km radius of ${hometown}
- Minimum salary: ₹${minSalary || 0} per month
- Job type: ${jobType || "Any (Full-time, Part-time, or Internship)"}
- Use realistic Indian company names and job titles
- Include specific locations (areas/neighborhoods) within ${hometown} or nearby cities
- Salary should be realistic for Indian job market (₹${minSalary || 0} to ₹${(minSalary || 20000) * 3} range)

Return ONLY a valid JSON array with this exact structure (no markdown, no code blocks, just pure JSON):
[
  {
    "title": "Job Title",
    "company": "Company Name",
    "location": "Specific area in ${hometown} or nearby",
    "salary": 25000,
    "jobType": "Full-time",
    "description": "Brief job description",
    "applyUrl": "https://example.com/jobs/apply/123"
  }
]

Make sure:
- All locations are realistic places near ${hometown}
- All salaries are numbers (not strings)
- Each job MUST include an "applyUrl" field with a realistic job application URL
- Use popular Indian job portals like: naukri.com, indeed.co.in, linkedin.com, timesjobs.com, monsterindia.com, shine.com
- Format: "https://www.naukri.com/job/..." or "https://in.indeed.com/viewjob?jk=..." or similar
- Make URLs realistic and varied across different job portals
- Return valid JSON only, no additional text`;

    // Use the latest Gemini API endpoint (with fallback)
    // Try different available models (model names must match exactly)
    const models = [
      'gemini-2.0-flash',           // Latest fast model
      'gemini-2.5-flash',           // Latest stable
      'gemini-flash-latest',        // Alias for latest flash
      'gemini-pro-latest',          // Latest pro model
      'gemini-2.0-flash-lite'       // Lightweight option
    ];
    let lastError = null;
    let response = null;
    
    for (const model of models) {
      try {
        // Model names from the API include "models/" prefix
        const modelName = model.startsWith('models/') ? model : `models/${model}`;
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/${modelName}:generateContent?key=${GEMINI_API_KEY}`;
        
        console.log(`[API Request] Trying model: ${model} for: ${hometown}`);
        
        response = await fetch(apiUrl, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: prompt }],
              },
            ],
            generationConfig: {
              temperature: 0.7,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 2048,
            },
          }),
        });
        
        if (response.ok) {
          console.log(`[API Request] ✅ Success with model: ${model}`);
          break;
        } else {
          let errorText;
          try {
            const errorJson = await response.json();
            errorText = JSON.stringify(errorJson);
          } catch {
            errorText = await response.text();
          }
          lastError = { status: response.status, model, error: errorText };
          console.log(`[API Request] ❌ Model ${model} failed with status ${response.status}: ${errorText.substring(0, 200)}`);
          
          // If it's a 404, try next model. If it's auth error, don't retry
          if (response.status === 401 || response.status === 403) {
            console.log(`[API Request] Auth error - stopping retries`);
            break; // Don't retry auth errors
          }
          // Continue to next model for other errors
        }
      } catch (fetchError) {
        console.error(`[API Request] Fetch error with ${model}:`, fetchError.message);
        lastError = { model, error: fetchError.message };
        // Continue to next model
      }
    }
    
    // If no successful response, handle error
    if (!response || !response.ok) {

      let errorData = lastError?.error || "Unknown error";
      let statusCode = lastError?.status || 500;
      
      console.error("Gemini API Error (all models failed):", statusCode, errorData);
      
      let errorMessage = "Failed to fetch jobs from AI service";
      let errorDetails = "API request failed";
      
      if (statusCode === 401 || statusCode === 403) {
        errorMessage = "Invalid API Key";
        errorDetails = "Please check your GEMINI_API_KEY in the .env file. Get your key from: https://makersuite.google.com/app/apikey";
      } else if (statusCode === 400) {
        errorMessage = "Invalid API Request";
        errorDetails = "Bad request to Gemini API. Please check your API key format.";
      } else if (statusCode === 404) {
        errorMessage = "API Model Not Found";
        errorDetails = "The Gemini API model is not available. Please check your API key has access to Gemini models.";
      } else if (statusCode === 429) {
        errorMessage = "API Rate Limit Exceeded";
        errorDetails = "Too many requests. Please try again later";
      } else if (statusCode === 500) {
        errorMessage = "Gemini API Server Error";
        errorDetails = "Google's API is experiencing issues. Please try again later";
      } else {
        errorDetails = `Error: ${errorData}`;
      }
      
      return res.status(500).json({ 
        error: errorMessage,
        details: errorDetails,
        statusCode: statusCode
      });
    }

    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      console.error("Unexpected API response:", JSON.stringify(data, null, 2));
      return res.status(500).json({ 
        error: "Invalid response from AI service",
        details: "Please try again"
      });
    }

    const text = data.candidates[0].content.parts[0].text.trim();
    
    // Clean the response - remove markdown code blocks if present
    let cleanedText = text;
    if (cleanedText.startsWith("```json")) {
      cleanedText = cleanedText.replace(/```json\n?/g, "").replace(/```\n?/g, "");
    } else if (cleanedText.startsWith("```")) {
      cleanedText = cleanedText.replace(/```\n?/g, "");
    }
    
    // Extract JSON from response if it's wrapped in text
    const jsonMatch = cleanedText.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      cleanedText = jsonMatch[0];
    }

    let jobs = [];
    try {
      jobs = JSON.parse(cleanedText);
      
      // Validate it's an array
      if (!Array.isArray(jobs)) {
        throw new Error("Response is not an array");
      }
      
      // Ensure all jobs have required fields
      jobs = jobs.map(job => ({
        title: job.title || "Job Title",
        company: job.company || "Company",
        location: job.location || hometown,
        salary: typeof job.salary === "number" ? job.salary : parseInt(job.salary) || 0,
        jobType: job.jobType || jobType || "Full-time",
        description: job.description || "",
        applyUrl: job.applyUrl || job.apply_url || `https://www.naukri.com/job-listings-${job.title?.toLowerCase().replace(/\s+/g, '-') || 'job'}-${hometown.toLowerCase()}-jobs`
      })).filter(job => job.salary >= (parseInt(minSalary) || 0));
      
    } catch (parseError) {
      console.error("JSON Parse Error:", parseError);
      console.error("Raw response:", text);
      return res.status(500).json({ 
        error: "Failed to parse AI response",
        details: "The AI service returned invalid data. Please try again."
      });
    }

    // Validate jobs array
    if (!Array.isArray(jobs) || jobs.length === 0) {
      return res.status(200).json({ 
        error: "No jobs found matching your criteria",
        details: "Try adjusting your search parameters",
        jobs: []
      });
    }

    // Ensure response is always valid JSON array
    res.status(200).json(jobs);
  } catch (err) {
    console.error("Server Error:", err);
    
    // Always return valid JSON, even on errors
    const errorResponse = {
      error: "Internal server error",
      details: err.message || "An unexpected error occurred",
      jobs: []
    };
    
    res.status(500).json(errorResponse);
  }
});


// Root route - serve the main HTML page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "Local-job-Finder.html"));
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "ok", 
    apiKeyConfigured: !!GEMINI_API_KEY,
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log("🚀 Local Job Finder Server Started");
  console.log(`📍 Server running at http://localhost:${PORT}`);
  console.log(`🔑 API Key configured: ${GEMINI_API_KEY ? "✅ Yes" : "❌ No (Please set GEMINI_API_KEY in .env file)"}`);
  console.log(`\n📝 Make sure to:`);
  console.log(`   1. Create a .env file with your GEMINI_API_KEY`);
  console.log(`   2. Get your API key from: https://makersuite.google.com/app/apikey`);
  console.log(`   3. Open http://localhost:${PORT} in your browser\n`);
});
