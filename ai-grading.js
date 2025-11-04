// ==========================================
// AI Grading Module - OpenAI Integration
// ==========================================

class AIGrader {
  constructor(openaiApiKey) {
    this.apiKey = openaiApiKey;
    this.apiUrl = 'https://api.openai.com/v1/chat/completions';
  }

  // Grade a submission using OpenAI
  async gradeSubmission(assignmentData) {
    const {
      assignment_title,
      instructions,
      rubric,
      submission_url,
      file_url,
      student_notes
    } = assignmentData;

    const prompt = this.buildGradingPrompt(
      assignment_title,
      instructions,
      rubric,
      submission_url,
      file_url,
      student_notes
    );

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o',  // or 'gpt-4' or 'gpt-3.5-turbo'
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
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const result = JSON.parse(data.choices[0].message.content);

      return {
        score: result.score,
        feedback: result.feedback,
        strengths: result.strengths,
        improvements: result.improvements,
        analysis: result.analysis
      };
    } catch (error) {
      console.error('AI Grading error:', error);
      throw error;
    }
  }

  // Build the grading prompt
  buildGradingPrompt(title, instructions, rubric, submissionUrl, fileUrl, notes) {
    return `
Grade this student assignment and return ONLY a JSON object with this exact structure:
{
  "score": <number 1-5>,
  "feedback": "<overall feedback>",
  "strengths": "<what they did well>",
  "improvements": "<suggestions for improvement>",
  "analysis": "<detailed technical analysis>"
}

ASSIGNMENT: ${title}

INSTRUCTIONS:
${instructions}

GRADING RUBRIC:
${rubric || 'Grade based on completeness, quality, and effort. Be fair and encouraging.'}

STUDENT SUBMISSION:
${submissionUrl ? `URL: ${submissionUrl}` : ''}
${fileUrl ? `File: ${fileUrl}` : ''}
${notes ? `Student Notes: ${notes}` : ''}

Important:
- Visit the URL if provided and analyze the work
- Be constructive and encouraging
- Provide specific examples
- Grade fairly but kindly
- Focus on learning progress
- Return ONLY the JSON object, no other text
`.trim();
  }

  // Analyze an image submission
  async gradeImageSubmission(assignmentData, imageUrl) {
    const {
      assignment_title,
      instructions,
      rubric,
      student_notes
    } = assignmentData;

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o',  // GPT-4 Vision
          messages: [
            {
              role: 'system',
              content: 'You are an expert teaching assistant grading student work. Analyze the image submission and provide constructive feedback. Grade on a 1-5 scale.'
            },
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: `
Grade this visual assignment:

ASSIGNMENT: ${assignment_title}
INSTRUCTIONS: ${instructions}
RUBRIC: ${rubric || 'Grade based on quality, effort, and meeting requirements'}
${student_notes ? `STUDENT NOTES: ${student_notes}` : ''}

Return ONLY a JSON object:
{
  "score": <1-5>,
  "feedback": "<feedback>",
  "strengths": "<strengths>",
  "improvements": "<improvements>",
  "analysis": "<detailed analysis>"
}
                  `.trim()
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: imageUrl
                  }
                }
              ]
            }
          ],
          max_tokens: 1000,
          response_format: { type: 'json_object' }
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const result = JSON.parse(data.choices[0].message.content);

      return {
        score: result.score,
        feedback: result.feedback,
        strengths: result.strengths,
        improvements: result.improvements,
        analysis: result.analysis
      };
    } catch (error) {
      console.error('AI Image Grading error:', error);
      throw error;
    }
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AIGrader;
}

