const Groq = require('groq-sdk');

let groqClient = null;

const getGroqClient = () => {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('Groq API key not configured in environment variables');
  }

  if (!groqClient) {
    groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }

  return groqClient;
};

/**
 * Build a professional veterinary prompt for Groq
 */
const buildVeterinaryPrompt = (cow, symptoms, healthRecords, vaccinations) => {
  const age = cow && cow.dateOfBirth
    ? Math.floor((new Date() - new Date(cow.dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000))
    : 'unknown';

  const breed = cow ? (cow.breed || 'N/A') : 'N/A';
  const weight = cow && cow.weight ? `${cow.weight} ${cow.weightUnit || 'kg'}` : 'N/A';
  const tagNumber = cow ? cow.tagNumber : 'N/A';
  const name = cow ? (cow.name || 'N/A') : 'N/A';
  const gender = cow ? cow.gender : 'unknown';
  const healthStatus = cow ? (cow.healthStatus || 'N/A') : 'N/A';
  const location = cow ? (cow.location || 'N/A') : 'N/A';
  const image = cow && cow.image ? cow.image : null;

  const recentRecords = healthRecords?.slice(0, 3) || [];
  const recentVaccinations = vaccinations?.slice(0, 5) || [];

  return `You are an experienced livestock veterinarian specializing in cattle health. Analyze the following information and provide a structured veterinary assessment.

COW INFORMATION:
- Tag Number: ${tagNumber}
- Name: ${name}
- Breed: ${breed}
- Gender: ${gender}
- Age: ${age} years
- Weight: ${weight}
- Health Status: ${healthStatus}
- Location: ${location}
${image ? `- Image URL: ${image}` : ''}

SYMPTOMS REPORTED BY FARMER:
${symptoms}

RECENT HEALTH RECORDS (last 3):
${recentRecords.length > 0
  ? recentRecords.map(r => `- ${r.date ? new Date(r.date).toLocaleDateString() : 'N/A'}: ${r.type} - ${r.diagnosis || 'No diagnosis'} ${r.treatment ? `| Treatment: ${r.treatment}` : ''}`).join('\n')
  : 'No recent health records'}

VACCINATION HISTORY (last 5):
${recentVaccinations.length > 0
  ? recentVaccinations.map(v => `- ${v.vaccineName} (Given: ${v.dateGiven ? new Date(v.dateGiven).toLocaleDateString() : 'N/A'}${v.nextDueDate ? `, Next due: ${new Date(v.nextDueDate).toLocaleDateString()}` : ''})`).join('\n')
  : 'No vaccination records'}

INSTRUCTIONS:
Provide a structured JSON response ONLY with the specified format. Use JSON format. Ensure all strings are correctly closed and the response is a valid, parseable JSON object. Do not include markdown code block styling like \`\`\`json.

The JSON response MUST have exactly the following keys and structure:
{
  "possibleDiseases": [
    {
      "disease": "Disease name",
      "probability": 75,
      "category": "respiratory|digestive|reproductive|metabolic|infectious|parasitic|injury|nutritional|other",
      "severity": "low|medium|high|critical",
      "description": "Brief description of the disease"
    }
  ],
  "confidenceScore": 85,
  "severity": "low|medium|high|critical",
  "healthScore": 65,
  "likelyCauses": "List likely causes based on symptoms, breed, age, and history",
  "recommendedTreatment": "Detailed treatment recommendations and medications if applicable",
  "preventionTips": "Preventive measures for the future",
  "requiresVetAttention": true,
  "emergencyAlert": "Urgent emergency notice if severe or critical, empty string otherwise",
  "disclaimer": "This is an AI-assisted assessment, not a confirmed diagnosis. Always consult a licensed veterinarian."
}

RULES:
1. Rank diseases by probability in "possibleDiseases" (highest first).
2. The severity for each possible disease and the overall "severity" must be one of: "low", "medium", "high", or "critical".
3. Provide practical, highly specific veterinary advice.
4. Set "requiresVetAttention" to true if severity is "high" or "critical", or if immediate attention is needed.
5. "healthScore" should be between 0 and 100 (lower score indicating worse health).
6. Return ONLY the JSON object. Do not wrap in markdown or add notes before/after.`;
};

/**
 * Analyze cow symptoms using Groq API
 */
const parseGroqResponse = (responseText) => {
  if (!responseText) {
    throw new Error('Empty response from Groq API');
  }

  const cleaned = responseText
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```$/i, '');

  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  const jsonCandidate = firstBrace >= 0 && lastBrace > firstBrace
    ? cleaned.slice(firstBrace, lastBrace + 1)
    : cleaned;

  const parsedData = JSON.parse(jsonCandidate);
  if (!parsedData.possibleDiseases || !Array.isArray(parsedData.possibleDiseases)) {
    throw new Error('Invalid response structure from Groq API: missing possibleDiseases');
  }

  return parsedData;
};

const analyzeSymptoms = async (cow, symptoms, healthRecords = [], vaccinations = []) => {
  try {
    if (!process.env.GROQ_API_KEY) {
      throw new Error('Groq API key not configured in environment variables');
    }

    const prompt = buildVeterinaryPrompt(cow, symptoms, healthRecords, vaccinations);
    const groq = getGroqClient();

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      model: 'llama-3.1-8b-instant',
      response_format: { type: 'json_object' },
      temperature: 0.2,
    });

    const responseText = chatCompletion.choices[0]?.message?.content;
    const parsedData = parseGroqResponse(responseText);

    return {
      success: true,
      data: parsedData,
    };
  } catch (error) {
    console.error('Groq AI Diagnosis error:', error);
    throw new Error(`AI analysis failed: ${error.message}`);
  }
};

module.exports = {
  analyzeSymptoms,
};
