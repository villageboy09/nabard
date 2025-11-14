import { GoogleGenerativeAI } from '@google/generative-ai';
import { logger } from '../utils/logger.js';

interface RiskAnalysisInput {
  fieldId: string;
  cropType: string;
  cropStage: string;
  overallRisk: number;
  riskLevel: string;
  weatherRisk: number;
  ndviRisk: number;
  soilMoistureRisk: number;
  pestRisk: number;
  marketRisk: number;
  yieldImpact: number;
  repaymentRisk: number;
  district: string;
  state: string;
  weatherForecast?: any;
  pestAdvisories?: any[];
}

interface GeminiAnalysisResult {
  summary: string;
  recommendations: string;
  actionableTips: string[];
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
}

export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY || '';
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
  }

  /**
   * Generate comprehensive risk analysis and recommendations
   */
  async generateRiskAnalysis(input: RiskAnalysisInput): Promise<GeminiAnalysisResult> {
    try {
      const prompt = this.buildRiskAnalysisPrompt(input);

      logger.debug('Sending request to Gemini for risk analysis');
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Parse the response
      const analysis = this.parseGeminiResponse(text);

      logger.info(`Generated risk analysis for field ${input.fieldId}`);
      return analysis;
    } catch (error) {
      logger.error('Gemini API error:', error);
      // Return fallback analysis
      return this.getFallbackAnalysis(input);
    }
  }

  /**
   * Generate farmer advisory in local language
   */
  async generateFarmerAdvisory(
    input: RiskAnalysisInput,
    language: string = 'en'
  ): Promise<{
    title: string;
    message: string;
    actions: string[];
  }> {
    try {
      const prompt = `You are an agricultural expert advisor. Generate a clear, actionable advisory for a farmer.

Context:
- Crop: ${input.cropType}
- Crop Stage: ${input.cropStage}
- Overall Risk Level: ${input.riskLevel} (${input.overallRisk.toFixed(0)}/100)
- Weather Risk: ${input.weatherRisk.toFixed(0)}/100
- Crop Health Risk: ${input.ndviRisk.toFixed(0)}/100
- Pest Risk: ${input.pestRisk.toFixed(0)}/100
- Market Risk: ${input.marketRisk.toFixed(0)}/100
- Expected Yield Impact: ${input.yieldImpact.toFixed(0)}%

Generate a farmer advisory in ${language === 'hi' ? 'Hindi' : 'English'} with:
1. A clear title (max 10 words)
2. A message explaining the situation in simple terms (2-3 sentences)
3. 3-5 specific actionable steps the farmer should take

Format your response as:
TITLE: [title here]
MESSAGE: [message here]
ACTIONS:
- [action 1]
- [action 2]
- [action 3]`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Parse response
      const lines = text.split('\n');
      const title = lines.find((l) => l.startsWith('TITLE:'))?.replace('TITLE:', '').trim() || 'Risk Alert';
      const message =
        lines.find((l) => l.startsWith('MESSAGE:'))?.replace('MESSAGE:', '').trim() ||
        'Please check your field regularly.';
      const actions = lines
        .filter((l) => l.trim().startsWith('-'))
        .map((l) => l.trim().substring(1).trim());

      return { title, message, actions };
    } catch (error) {
      logger.error('Gemini advisory generation error:', error);
      return this.getFallbackAdvisory(input);
    }
  }

  /**
   * Generate lender risk brief
   */
  async generateLenderBrief(
    input: RiskAnalysisInput
  ): Promise<{
    summary: string;
    repaymentRiskAssessment: string;
    recommendedActions: string[];
  }> {
    try {
      const prompt = `You are a financial risk analyst for agricultural lending. Analyze the following loan risk scenario:

Farmer Details:
- Location: ${input.district}, ${input.state}
- Crop: ${input.cropType} (${input.cropStage} stage)

Risk Assessment:
- Overall Risk Score: ${input.overallRisk.toFixed(0)}/100 (${input.riskLevel})
- Repayment Risk: ${input.repaymentRisk.toFixed(0)}/100
- Expected Yield Impact: ${input.yieldImpact.toFixed(0)}%
- Weather Risk: ${input.weatherRisk.toFixed(0)}/100
- Crop Health: ${input.ndviRisk.toFixed(0)}/100
- Market Risk: ${input.marketRisk.toFixed(0)}/100

Provide:
1. SUMMARY: A 2-3 sentence executive summary of the risk
2. REPAYMENT: Assessment of loan repayment probability
3. ACTIONS: 3-4 recommended actions for the lender

Format as:
SUMMARY: [summary]
REPAYMENT: [assessment]
ACTIONS:
- [action 1]
- [action 2]`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const lines = text.split('\n');
      const summary = lines.find((l) => l.startsWith('SUMMARY:'))?.replace('SUMMARY:', '').trim() || '';
      const repayment = lines.find((l) => l.startsWith('REPAYMENT:'))?.replace('REPAYMENT:', '').trim() || '';
      const actions = lines
        .filter((l) => l.trim().startsWith('-'))
        .map((l) => l.trim().substring(1).trim());

      return {
        summary,
        repaymentRiskAssessment: repayment,
        recommendedActions: actions,
      };
    } catch (error) {
      logger.error('Gemini lender brief error:', error);
      return {
        summary: `${input.riskLevel} risk detected for ${input.cropType} crop with ${input.repaymentRisk.toFixed(0)}% repayment risk.`,
        repaymentRiskAssessment: `The loan has a ${input.repaymentRisk.toFixed(0)}% repayment risk due to agricultural challenges.`,
        recommendedActions: [
          'Monitor field conditions closely',
          'Consider restructuring if risk exceeds 75%',
          'Engage with farmer for mitigation plans',
        ],
      };
    }
  }

  /**
   * Generate pest control recommendations
   */
  async generatePestControlAdvice(
    cropType: string,
    pestAdvisories: any[]
  ): Promise<{
    summary: string;
    recommendations: string[];
  }> {
    try {
      const pestList = pestAdvisories.map((p) => `- ${p.pestName} (${p.severity} severity)`).join('\n');

      const prompt = `As an agricultural pest management expert, provide pest control recommendations.

Crop: ${cropType}
Active Pest Threats:
${pestList}

Provide:
1. A brief summary of the pest situation (2 sentences)
2. 4-5 specific control measures the farmer should implement

Format as:
SUMMARY: [summary]
RECOMMENDATIONS:
- [recommendation 1]
- [recommendation 2]`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const lines = text.split('\n');
      const summary = lines.find((l) => l.startsWith('SUMMARY:'))?.replace('SUMMARY:', '').trim() || '';
      const recommendations = lines
        .filter((l) => l.trim().startsWith('-'))
        .map((l) => l.trim().substring(1).trim());

      return { summary, recommendations };
    } catch (error) {
      logger.error('Gemini pest advice error:', error);
      return {
        summary: 'Pest pressure detected. Immediate action recommended.',
        recommendations: [
          'Scout fields regularly for pest presence',
          'Use integrated pest management practices',
          'Apply recommended pesticides if threshold exceeded',
          'Maintain field hygiene',
        ],
      };
    }
  }

  /**
   * Build comprehensive risk analysis prompt
   */
  private buildRiskAnalysisPrompt(input: RiskAnalysisInput): string {
    return `You are an expert agricultural risk analyst. Analyze the following agricultural risk scenario and provide actionable insights.

Field Information:
- Location: ${input.district}, ${input.state}
- Crop: ${input.cropType}
- Growth Stage: ${input.cropStage}

Risk Assessment (0-100 scale, higher = more risk):
- Overall Risk: ${input.overallRisk.toFixed(1)}/100 (Level: ${input.riskLevel})
- Weather Risk: ${input.weatherRisk.toFixed(1)}/100
- Crop Health (NDVI): ${input.ndviRisk.toFixed(1)}/100
- Soil Moisture: ${input.soilMoistureRisk.toFixed(1)}/100
- Pest & Disease: ${input.pestRisk.toFixed(1)}/100
- Market Price: ${input.marketRisk.toFixed(1)}/100

Impact Projections:
- Expected Yield Impact: ${input.yieldImpact.toFixed(1)}% reduction
- Loan Repayment Risk: ${input.repaymentRisk.toFixed(1)}/100

Provide a comprehensive analysis with:
1. SUMMARY: A clear 2-3 paragraph summary of the risk situation, highlighting the most critical factors
2. RECOMMENDATIONS: Specific, actionable recommendations for risk mitigation (5-7 points)
3. URGENCY: Rate the urgency level as LOW, MEDIUM, HIGH, or CRITICAL

Format your response as:
SUMMARY:
[Your detailed summary here]

RECOMMENDATIONS:
- [Recommendation 1]
- [Recommendation 2]
- [Recommendation 3]
...

URGENCY: [LEVEL]

Focus on practical, implementable solutions that a farmer can take in the next 7-15 days.`;
  }

  /**
   * Parse Gemini response into structured format
   */
  private parseGeminiResponse(text: string): GeminiAnalysisResult {
    const lines = text.split('\n');

    // Extract summary
    const summaryStart = lines.findIndex((l) => l.includes('SUMMARY'));
    const recsStart = lines.findIndex((l) => l.includes('RECOMMENDATIONS'));
    const urgencyLine = lines.find((l) => l.includes('URGENCY'));

    const summaryLines = lines.slice(summaryStart + 1, recsStart).filter((l) => l.trim());
    const summary = summaryLines.join(' ').trim();

    // Extract recommendations
    const recommendations = lines
      .slice(recsStart + 1)
      .filter((l) => l.trim().startsWith('-'))
      .map((l) => l.trim().substring(1).trim())
      .join('\n');

    const actionableTips = lines
      .slice(recsStart + 1)
      .filter((l) => l.trim().startsWith('-'))
      .map((l) => l.trim().substring(1).trim());

    // Extract urgency
    const urgencyMatch = urgencyLine?.match(/(LOW|MEDIUM|HIGH|CRITICAL)/i);
    const urgencyLevel = (urgencyMatch?.[0]?.toLowerCase() || 'medium') as
      | 'low'
      | 'medium'
      | 'high'
      | 'critical';

    return {
      summary,
      recommendations,
      actionableTips,
      urgencyLevel,
    };
  }

  /**
   * Fallback analysis when Gemini is unavailable
   */
  private getFallbackAnalysis(input: RiskAnalysisInput): GeminiAnalysisResult {
    const riskLevelDesc = {
      LOW: 'low',
      MEDIUM: 'moderate',
      HIGH: 'high',
      CRITICAL: 'critical',
    }[input.riskLevel];

    const summary = `The ${input.cropType} crop at ${input.cropStage} stage is experiencing ${riskLevelDesc} risk levels (${input.overallRisk.toFixed(0)}/100). Primary concerns include weather conditions (risk: ${input.weatherRisk.toFixed(0)}), crop health status (risk: ${input.ndviRisk.toFixed(0)}), and pest pressure (risk: ${input.pestRisk.toFixed(0)}). Expected yield impact is approximately ${input.yieldImpact.toFixed(0)}%, which could affect loan repayment capacity.`;

    const recommendations = `
- Monitor weather forecasts daily and prepare for extreme events
- Inspect crop health regularly and address any visible stress symptoms
- Implement preventive pest management measures
- Ensure adequate irrigation based on soil moisture levels
- Consider crop insurance if not already covered
- Maintain communication with agricultural extension officers
    `.trim();

    const actionableTips = [
      'Monitor weather forecasts daily',
      'Inspect crop health regularly',
      'Implement preventive pest management',
      'Ensure adequate irrigation',
      'Consider crop insurance',
    ];

    return {
      summary,
      recommendations,
      actionableTips,
      urgencyLevel: input.overallRisk >= 75 ? 'critical' : input.overallRisk >= 50 ? 'high' : 'medium',
    };
  }

  /**
   * Fallback advisory
   */
  private getFallbackAdvisory(input: RiskAnalysisInput): {
    title: string;
    message: string;
    actions: string[];
  } {
    return {
      title: `${input.riskLevel} Risk Alert for ${input.cropType}`,
      message: `Your ${input.cropType} crop is showing ${input.riskLevel.toLowerCase()} risk levels. Immediate attention is recommended to protect your yield.`,
      actions: [
        'Check your field daily',
        'Monitor weather conditions',
        'Look for pest or disease signs',
        'Contact agricultural officer if needed',
      ],
    };
  }
}

export const geminiService = new GeminiService();
