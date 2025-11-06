// Netlify Function: AI Grading with OpenAI
// This keeps your API key secure on the server

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { 
      assignment_title,
      instructions,
      rubric,
      submission_url,
      file_url,
      student_notes
    } = JSON.parse(event.body);

    // Build the grading prompt
    const prompt = `
Grade this student assignment and return ONLY a JSON object with this exact structure:
{
  "score": <number 1-5>,
  "feedback": "<overall feedback>",
  "strengths": "<what they did well>",
  "improvements": "<suggestions for improvement>",
  "analysis": "<detailed technical analysis>"
}

ASSIGNMENT: ${assignment_title}

INSTRUCTIONS:
${instructions}

GRADING RUBRIC:
${rubric || 'Grade based on completeness, quality, and effort. Be fair and encouraging.'}

STUDENT SUBMISSION:
${submission_url ? `URL: ${submission_url}` : ''}
${file_url ? `File: ${file_url}` : ''}
${student_notes ? `Student Notes: ${student_notes}` : ''}

Important:
- Visit the URL if provided and analyze the work
- Be constructive and encouraging
- Provide specific examples
- Grade fairly but kindly
- Focus on learning progress
- Return ONLY the JSON object, no other text
`.trim();

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are an expert teaching assistant grading student assignments. Provide constructive, encouraging feedback with specific examples. Grade on a 1-5 scale where 5 is excellent.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI API error:', error);
      return {
        statusCode: response.status,
        body: JSON.stringify({ 
          error: 'OpenAI API error',
          details: error
        })
      };
    }

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);

    // Return the grading result
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      body: JSON.stringify({
        score: result.score,
        feedback: result.feedback,
        strengths: result.strengths,
        improvements: result.improvements,
        analysis: result.analysis
      })
    };

  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error.message
      })
    };
  }
};

