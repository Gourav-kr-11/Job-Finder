# Local Job Finder

A modern web application that uses Google's Gemini AI to find job listings near your location. The application intelligently generates realistic job opportunities based on your hometown, search radius, job type, and salary requirements.

## Features

- 🤖 **AI-Powered Job Search**: Uses Google Gemini API to generate realistic job listings
- 📍 **Location-Based Search**: Find jobs within a specified radius of your hometown
- 💼 **Flexible Filters**: Filter by job type (Full-time, Part-time, Internship) and minimum salary
- 🎨 **Modern UI**: Clean, dark-themed interface with responsive design
- ⚡ **Fast & Efficient**: Lightweight and optimized for performance

## Prerequisites

- Node.js (v14 or higher)
- npm (Node Package Manager)
- A Google Gemini API key ([Get one here](https://makersuite.google.com/app/apikey))

## Installation

1. **Clone or download this project**

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   - Copy `.env.example` to `.env`
   ```bash
   copy .env.example .env
   ```
   - Open `.env` and add your Gemini API key:
   ```
   GEMINI_API_KEY=your_actual_api_key_here
   ```

## Running the Application

1. **Start the server**
   ```bash
   npm start
   ```

2. **Open your browser**
   - Navigate to: `http://localhost:3000/Local-job-Finder.html`
   - Or simply: `http://localhost:3000`

3. **Search for jobs**
   - Enter your hometown/city
   - Set your preferred search radius (in km)
   - Select job type (optional)
   - Set minimum salary (optional)
   - Click "Search Jobs"

## Project Structure

```
.
├── Local-job-Finder.html  # Main HTML page
├── app.js                 # Frontend JavaScript
├── styles.css            # Styling
├── server.js             # Express.js backend server
├── package.json          # Dependencies
├── .env                  # Environment variables (create this)
├── .env.example          # Example environment file
└── README.md             # This file
```

## API Endpoints

### POST `/api/ai-jobs`
Search for jobs using Gemini AI

**Request Body:**
```json
{
  "hometown": "Lucknow",
  "radius": 20,
  "jobType": "Full-time",
  "minSalary": 15000
}
```

**Response:**
```json
[
  {
    "title": "Software Developer",
    "company": "Tech Solutions Pvt Ltd",
    "location": "Gomti Nagar, Lucknow",
    "salary": 25000,
    "jobType": "Full-time",
    "description": "Looking for a skilled developer..."
  }
]
```

### GET `/api/health`
Health check endpoint

## Configuration

### Environment Variables

- `GEMINI_API_KEY` (required): Your Google Gemini API key
- `PORT` (optional): Server port (default: 3000)

## Troubleshooting

### "API Key not configured" error
- Make sure you've created a `.env` file
- Verify your `GEMINI_API_KEY` is set correctly
- Restart the server after adding the API key

### "Network Error" or connection issues
- Ensure the server is running (`npm start`)
- Check that you're accessing the correct URL
- Verify your firewall isn't blocking port 3000

### No jobs found
- Try expanding your search radius
- Adjust minimum salary requirements
- Try a different job type or leave it as "Any"

## Technologies Used

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Node.js, Express.js
- **AI**: Google Gemini API
- **Package Management**: npm

## License

This project is open source and available for educational purposes.

## Support

For issues or questions, please check:
- [Google Gemini API Documentation](https://ai.google.dev/docs)
- [Express.js Documentation](https://expressjs.com/)

---
//cd public, npm start
**Made with ❤️ for connecting people with local job opportunities**

