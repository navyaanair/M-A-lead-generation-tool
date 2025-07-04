
import React, { useState, useMemo } from 'react';
import { Search, Target, TrendingUp, Globe, Users, Zap, Building, Star, Brain, MessageSquare, Loader, AlertCircle } from 'lucide-react';
import { initialCompanies } from './Data/syntheticAcquisitionData.js';

const MAAcquisitionTool = () => {
  const [buyerProfile, setBuyerProfile] = useState({
    companyName: "",
    description: "",
    strengths: "",
    gaps: "",
    strategicGoals: "",
    budgetRange: "$10M - $50M",
    timeframe: "6-12 months"
  });

  const [companies, setCompanies] = useState(initialCompanies);
  const [showAddCompany, setShowAddCompany] = useState(false);
  const [newCompany, setNewCompany] = useState({
    name: '',
    industry: '',
    location: '',
    revenue: '',
    employees: '',
    description: '',
    keyMetrics: {
      growthRate: '',
      margins: '',
      customerRetention: '',
      marketPosition: ''
    },
    strengths: [],
    challenges: []
  });
  const [editingCompany, setEditingCompany] = useState(null);
  const [leadAnalyses, setLeadAnalyses] = useState({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [analysisError, setAnalysisError] = useState(null);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0 });

  // Enhanced LLM Analysis with optimizations
  const performLlamaAnalysis = async (profile, targetLeads) => {
    try {
      // Batch analysis - analyze multiple companies in one call
      const batchPrompt = `You are an expert M&A strategist. Analyze strategic fit between the buyer and ALL target companies below.

BUYER PROFILE:
Company: ${profile.companyName}
Description: ${profile.description}
Strengths: ${profile.strengths}
Strategic Gaps: ${profile.gaps}
Strategic Goals: ${profile.strategicGoals}
Budget Range: ${profile.budgetRange}
Timeframe: ${profile.timeframe}

TARGET COMPANIES:
${targetLeads.map((lead, idx) => `
${idx + 1}. ${lead.name}
   Industry: ${lead.industry}
   Location: ${lead.location}
   Revenue: ${lead.revenue}
   Employees: ${lead.employees}
   Description: ${lead.description}
   Growth: ${lead.keyMetrics?.growthRate || 'N/A'}
   Margins: ${lead.keyMetrics?.margins || 'N/A'}
   Retention: ${lead.keyMetrics?.customerRetention || 'N/A'}
   Market Position: ${lead.keyMetrics?.marketPosition || 'N/A'}
   Strengths: ${lead.strengths?.join(', ') || 'N/A'}
   Challenges: ${lead.challenges?.join(', ') || 'N/A'}
`).join('')}

Provide analysis for ALL companies in this exact JSON format:
{
  "analyses": [
    {
      "companyName": "Company Name",
      "score": [0-100],
      "reasoning": "[concise strategic fit explanation]",
      "synergies": ["synergy1", "synergy2", "synergy3"],
      "risks": ["risk1", "risk2", "risk3"],
      "integrationComplexity": "[Low/Medium/High]",
      "timeToValue": "[time estimate]",
      "strategicValue": "[brief assessment]"
    }
  ]
}

Focus on:
- Strategic gap alignment
- Market expansion opportunities  
- Technology/capability synergies
- Revenue synergies
- Integration complexity
- Budget fit

Keep responses concise. Respond only with the JSON object.`;

      const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama3',
          prompt: batchPrompt,
          stream: false,
          options: {
            temperature: 0.5, // Lower temperature for more consistent results
            top_p: 0.8,
            max_tokens: 2000, // Increased for batch processing
            num_predict: 2000,
            repeat_penalty: 1.1,
            stop: ["\n\n---", "END_ANALYSIS"] // Stop tokens to prevent over-generation
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status}`);
      }

      const data = await response.json();
      let analysisText = data.response;

      // Enhanced JSON extraction
      const jsonMatch = analysisText.match(/\{[\s\S]*"analyses"[\s\S]*\}/);
      if (jsonMatch) {
        analysisText = jsonMatch[0];
      }

      // Parse and validate
      const batchAnalysis = JSON.parse(analysisText);
      
      if (!batchAnalysis.analyses || !Array.isArray(batchAnalysis.analyses)) {
        throw new Error('Invalid batch analysis format');
      }

      // Convert to results map
      const results = {};
      batchAnalysis.analyses.forEach(analysis => {
        const matchingLead = targetLeads.find(lead => 
          lead.name.toLowerCase().includes(analysis.companyName.toLowerCase()) ||
          analysis.companyName.toLowerCase().includes(lead.name.toLowerCase())
        );
        
        if (matchingLead) {
          results[matchingLead.id] = {
            score: Math.min(100, Math.max(0, analysis.score || 50)),
            reasoning: analysis.reasoning || 'Analysis completed',
            synergies: Array.isArray(analysis.synergies) ? analysis.synergies : [],
            risks: Array.isArray(analysis.risks) ? analysis.risks : [],
            integrationComplexity: analysis.integrationComplexity || 'Medium',
            timeToValue: analysis.timeToValue || '6-12 months',
            strategicValue: analysis.strategicValue || 'Under evaluation'
          };
        }
      });

      return results;

    } catch (error) {
      console.error('LLM Analysis Error:', error);
      
      // Fallback to individual analysis if batch fails
      return await performIndividualAnalysis(profile, targetLeads);
    }
  };

  // Fallback individual analysis with parallel processing
  const performIndividualAnalysis = async (profile, targetLeads) => {
    const results = {};
    
    // Process in parallel batches of 3
    const batchSize = 3;
    const batches = [];
    
    for (let i = 0; i < targetLeads.length; i += batchSize) {
      batches.push(targetLeads.slice(i, i + batchSize));
    }
    
    for (const batch of batches) {
      const batchPromises = batch.map(lead => analyzeSingleCompany(profile, lead));
      const batchResults = await Promise.all(batchPromises);
      
      batch.forEach((lead, index) => {
        results[lead.id] = batchResults[index];
      });
      
      // Update progress
      setBatchProgress(prev => ({ ...prev, current: prev.current + batch.length }));
    }
    
    return results;
  };

  // Single company analysis with optimized prompt
  const analyzeSingleCompany = async (profile, lead) => {
    try {
      const compactPrompt = `M&A Analysis:
Buyer: ${profile.companyName} - ${profile.description}
Gaps: ${profile.gaps}
Goals: ${profile.strategicGoals}

Target: ${lead.name} - ${lead.industry} - ${lead.revenue} - ${lead.description}

JSON Response:
{"score": [0-100], "reasoning": "[brief fit analysis]", "synergies": ["syn1","syn2","syn3"], "risks": ["risk1","risk2"], "integrationComplexity": "[Low/Medium/High]", "timeToValue": "[timeframe]", "strategicValue": "[brief value]"}`;

      const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama3',
          prompt: compactPrompt,
          stream: false,
          options: {
            temperature: 0.3,
            top_p: 0.7,
            max_tokens: 500,
            num_predict: 500,
            repeat_penalty: 1.1
          }
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      let analysisText = data.response;

      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisText = jsonMatch[0];
      }

      const analysis = JSON.parse(analysisText);
      
      return {
        score: Math.min(100, Math.max(0, analysis.score || 50)),
        reasoning: analysis.reasoning || 'Analysis completed',
        synergies: Array.isArray(analysis.synergies) ? analysis.synergies : [],
        risks: Array.isArray(analysis.risks) ? analysis.risks : [],
        integrationComplexity: analysis.integrationComplexity || 'Medium',
        timeToValue: analysis.timeToValue || '6-12 months',
        strategicValue: analysis.strategicValue || 'Under evaluation'
      };

    } catch (error) {
      console.error('Single analysis error:', error);
      return {
        score: 50,
        reasoning: `Analysis failed: ${error.message}`,
        synergies: ['Analysis unavailable'],
        risks: ['Unable to assess risks'],
        integrationComplexity: 'Unknown',
        timeToValue: 'Unknown',
        strategicValue: 'Analysis failed'
      };
    }
  };

  // Enhanced analysis runner with progress tracking
  const runLLMAnalysis = async () => {
    setIsAnalyzing(true);
    setAnalysisComplete(false);
    setAnalysisError(null);
    setLeadAnalyses({});
    setBatchProgress({ current: 0, total: companies.length });
    
    try {
      // Test connection first
      const testResponse = await fetch('http://localhost:11434/api/tags');
      if (!testResponse.ok) {
        throw new Error('Cannot connect to Ollama. Please ensure Ollama is running on localhost:11434');
      }

      // Try batch analysis first (faster)
      let analyses = {};
      
      if (companies.length <= 8) {
        // Small batch - analyze all at once
        analyses = await performLlamaAnalysis(buyerProfile, companies);
      } else {
        // Large batch - split into smaller groups
        const batchSize = 5;
        const batches = [];
        
        for (let i = 0; i < companies.length; i += batchSize) {
          batches.push(companies.slice(i, i + batchSize));
        }
        
        for (const batch of batches) {
          const batchResults = await performLlamaAnalysis(buyerProfile, batch);
          analyses = { ...analyses, ...batchResults };
          setBatchProgress(prev => ({ ...prev, current: prev.current + batch.length }));
        }
      }
      
      setLeadAnalyses(analyses);
      setAnalysisComplete(true);
      
    } catch (error) {
      setAnalysisError(error.message);
      console.error('Analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
      setBatchProgress({ current: 0, total: 0 });
    }
  };

  // Memoize expensive computations
  const rankedLeads = useMemo(() => {
    return companies.map(lead => ({
      ...lead,
      analysis: leadAnalyses[lead.id] || null
    })).sort((a, b) => {
      const scoreA = a.analysis?.score || 0;
      const scoreB = b.analysis?.score || 0;
      return scoreB - scoreA;
    });
  }, [companies, leadAnalyses]);

  const handleNewCompanyChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setNewCompany(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setNewCompany(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const addCompany = () => {
    if (newCompany.name && newCompany.industry && newCompany.location) {
      const company = {
        ...newCompany,
        id: Date.now(),
        employees: parseInt(newCompany.employees) || 0,
        strengths: newCompany.strengths || [],
        challenges: newCompany.challenges || []
      };
      setCompanies(prev => [...prev, company]);
      setNewCompany({
        name: '',
        industry: '',
        location: '',
        revenue: '',
        employees: '',
        description: '',
        keyMetrics: {
          growthRate: '',
          margins: '',
          customerRetention: '',
          marketPosition: ''
        },
        strengths: [],
        challenges: []
      });
      setShowAddCompany(false);
    }
  };

  const deleteCompany = (id) => {
    setCompanies(prev => prev.filter(company => company.id !== id));
    setLeadAnalyses(prev => {
      const newAnalyses = { ...prev };
      delete newAnalyses[id];
      return newAnalyses;
    });
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 60) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (score >= 40) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getScoreLabel = (score) => {
    if (score >= 80) return 'Excellent Strategic Fit';
    if (score >= 60) return 'Good Strategic Fit';
    if (score >= 40) return 'Moderate Fit';
    return 'Limited Strategic Value';
  };

  const handleProfileChange = (field, value) => {
    setBuyerProfile(prev => ({
      ...prev,
      [field]: value
    }));
    // Reset analysis when profile changes
    setLeadAnalyses({});
    setAnalysisComplete(false);
    setAnalysisError(null);
  };

  return (
    <div className="max-w-7xl mx-auto p-6 bg-gradient-to-br from-purple-50 to-indigo-50 min-h-screen">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-3">
          <Brain className="text-purple-600" />
          AI-Powered M&A Strategic Matching
        </h1>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          Advanced Llama3 batch analysis to identify strategic acquisition targets
        </p>
        <div className="mt-2 text-sm text-gray-500">
          Powered by Ollama + Llama3 • {companies.length} companies • Batch Processing Enabled
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Buyer Profile Configuration */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-lg p-6 sticky top-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Building className="text-purple-600" />
              Your Company Profile
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
                <input
                  type="text"
                  value={buyerProfile.companyName}
                  onChange={(e) => handleProfileChange('companyName', e.target.value)}
                  placeholder="Enter your company name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Company Description</label>
                <textarea
                  value={buyerProfile.description}
                  onChange={(e) => handleProfileChange('description', e.target.value)}
                  placeholder="Describe your company's business, market focus, and current operations..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Key Strengths</label>
                <textarea
                  value={buyerProfile.strengths}
                  onChange={(e) => handleProfileChange('strengths', e.target.value)}
                  placeholder="List your company's main competitive advantages and core capabilities..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Strategic Gaps</label>
                <textarea
                  value={buyerProfile.gaps}
                  onChange={(e) => handleProfileChange('gaps', e.target.value)}
                  placeholder="Identify areas where your company needs improvement or expansion..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Strategic Goals</label>
                <textarea
                  value={buyerProfile.strategicGoals}
                  onChange={(e) => handleProfileChange('strategicGoals', e.target.value)}
                  placeholder="Define your key strategic objectives and growth targets..."
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Budget Range</label>
                  <select
                    value={buyerProfile.budgetRange}
                    onChange={(e) => handleProfileChange('budgetRange', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="$1M - $10M">$1M - $10M</option>
                    <option value="$10M - $50M">$10M - $50M</option>
                    <option value="$50M - $100M">$50M - $100M</option>
                    <option value="$100M+">$100M+</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Timeframe</label>
                  <select
                    value={buyerProfile.timeframe}
                    onChange={(e) => handleProfileChange('timeframe', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="3-6 months">3-6 months</option>
                    <option value="6-12 months">6-12 months</option>
                    <option value="12-18 months">12-18 months</option>
                    <option value="18+ months">18+ months</option>
                  </select>
                </div>
              </div>
            </div>
            
            <button
              onClick={runLLMAnalysis}
              disabled={isAnalyzing || !buyerProfile.companyName || !buyerProfile.description}
              className="w-full mt-6 bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
            >
              {isAnalyzing ? (
                <>
                  <Loader className="animate-spin" size={20} />
                  {batchProgress.total > 0 ? (
                    <span>Analyzing {batchProgress.current}/{batchProgress.total}...</span>
                  ) : (
                    <span>Analyzing with Llama3...</span>
                  )}
                </>
              ) : (
                <>
                  <Brain size={20} />
                  Run Fast Batch Analysis
                </>
              )}
            </button>
            
            {!buyerProfile.companyName || !buyerProfile.description ? (
              <p className="mt-2 text-sm text-gray-500 text-center">
                Please fill in company details to enable analysis
              </p>
            ) : null}
            
            {companies.length > 8 && (
              <div className="mt-2 text-xs text-blue-600 text-center">
                Large dataset detected - using optimized batch processing
              </div>
            )}
            
            {analysisError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 text-red-700">
                  <AlertCircle size={16} />
                  <span className="font-medium">Analysis Error</span>
                </div>
                <p className="text-red-600 text-sm mt-1">{analysisError}</p>
                <div className="text-xs text-red-500 mt-2">
                  Make sure Ollama is running: <code>ollama serve</code><br/>
                  Install Llama3: <code>ollama pull llama3</code>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Lead Results */}
        <div className="lg:col-span-2 space-y-6">
          {/* Company Management Section */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Building className="text-blue-600" />
                Target Companies ({companies.length})
              </h2>
              <button
                onClick={() => setShowAddCompany(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <span>+</span>
                Add Company
              </button>
            </div>

            {/* Add Company Form */}
            {showAddCompany && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
                <h3 className="font-medium text-gray-900 mb-4">Add New Company</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Company Name"
                    value={newCompany.name}
                    onChange={(e) => handleNewCompanyChange('name', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <input
                    type="text"
                    placeholder="Industry"
                    value={newCompany.industry}
                    onChange={(e) => handleNewCompanyChange('industry', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <input
                    type="text"
                    placeholder="Location"
                    value={newCompany.location}
                    onChange={(e) => handleNewCompanyChange('location', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <input
                    type="text"
                    placeholder="Revenue (e.g., $10M)"
                    value={newCompany.revenue}
                    onChange={(e) => handleNewCompanyChange('revenue', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <input
                    type="number"
                    placeholder="Employees"
                    value={newCompany.employees}
                    onChange={(e) => handleNewCompanyChange('employees', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <input
                    type="text"
                    placeholder="Growth Rate (e.g., 25% YoY)"
                    value={newCompany.keyMetrics.growthRate}
                    onChange={(e) => handleNewCompanyChange('keyMetrics.growthRate', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="mt-4">
                  <textarea
                    placeholder="Company Description"
                    value={newCompany.description}
                    onChange={(e) => handleNewCompanyChange('description', e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="grid md:grid-cols-3 gap-4 mt-4">
                  <input
                    type="text"
                    placeholder="Margins (e.g., 25%)"
                    value={newCompany.keyMetrics.margins}
                    onChange={(e) => handleNewCompanyChange('keyMetrics.margins', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <input
                    type="text"
                    placeholder="Customer Retention (e.g., 95%)"
                    value={newCompany.keyMetrics.customerRetention}
                    onChange={(e) => handleNewCompanyChange('keyMetrics.customerRetention', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <input
                    type="text"
                    placeholder="Market Position"
                    value={newCompany.keyMetrics.marketPosition}
                    onChange={(e) => handleNewCompanyChange('keyMetrics.marketPosition', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="flex gap-4 mt-4">
                  <button
                    onClick={addCompany}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                  >
                    Add Company
                  </button>
                  <button
                    onClick={() => setShowAddCompany(false)}
                    className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Company List */}
            <div className="space-y-3">
              {companies.map(company => (
                <div key={company.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{company.name}</h4>
                    <p className="text-sm text-gray-600">{company.industry} • {company.location}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => deleteCompany(company.id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Analysis Results */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <Target className="text-green-600" />
              Strategic Acquisition Analysis
            </h2>
            
            {!analysisComplete && !isAnalyzing && (
              <div className="text-center py-12">
                <MessageSquare className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Ready for AI Analysis</h3>
                <p className="text-gray-600 mb-6">
                  Configure your buyer profile and run the analysis to get AI-powered strategic fit scores
                </p>
                {buyerProfile.companyName && buyerProfile.description && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
                    <p className="text-blue-800 text-sm">
                      <strong>Profile Complete!</strong> Click "Run Fast Batch Analysis" to analyze {companies.length} companies with Llama3
                    </p>
                  </div>
                )}
              </div>
            )}
            
            {analysisComplete && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 text-green-700">
                  <Star className="h-5 w-5" />
                  <span className="font-medium">Analysis Complete!</span>
                </div>
                <p className="text-green-600 text-sm mt-1">
                  Analyzed {Object.keys(leadAnalyses).length} companies using Llama3 batch processing
                </p>
              </div>
            )}
            
            {rankedLeads.length > 0 && (
              <div className="space-y-4">
                {rankedLeads.map((lead, index) => (
                  <div key={lead.id} className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-semibold text-gray-900">{lead.name}</h3>
                          {lead.analysis && (
                            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getScoreColor(lead.analysis.score)}`}>
                              <Star className="h-4 w-4 mr-1" />
                              {lead.analysis.score}/100
                            </div>
                          )}
                        </div>
                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Building className="h-4 w-4" />
                            <span>{lead.industry}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Globe className="h-4 w-4" />
                            <span>{lead.location}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4" />
                            <span>{lead.revenue}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            <span>{lead.employees} employees</span>
                          </div>
                        </div>
                      </div>
                      {lead.analysis && (
                        <div className="ml-4 text-right">
                          <div className="text-sm font-medium text-gray-900">
                            {getScoreLabel(lead.analysis.score)}
                          </div>
                          <div className="text-xs text-gray-500">
                            Rank #{index + 1}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <p className="text-gray-700 mb-4">{lead.description}</p>
                    
                    {lead.keyMetrics && (
                      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                        {lead.keyMetrics.growthRate && (
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <div className="text-xs text-gray-500 uppercase tracking-wide">Growth Rate</div>
                            <div className="font-medium text-gray-900">{lead.keyMetrics.growthRate}</div>
                          </div>
                        )}
                        {lead.keyMetrics.margins && (
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <div className="text-xs text-gray-500 uppercase tracking-wide">Margins</div>
                            <div className="font-medium text-gray-900">{lead.keyMetrics.margins}</div>
                          </div>
                        )}
                        {lead.keyMetrics.customerRetention && (
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <div className="text-xs text-gray-500 uppercase tracking-wide">Customer Retention</div>
                            <div className="font-medium text-gray-900">{lead.keyMetrics.customerRetention}</div>
                          </div>
                        )}
                        {lead.keyMetrics.marketPosition && (
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <div className="text-xs text-gray-500 uppercase tracking-wide">Market Position</div>
                            <div className="font-medium text-gray-900">{lead.keyMetrics.marketPosition}</div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {lead.analysis && (
                      <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                          <Brain className="h-4 w-4 text-purple-600" />
                          AI Strategic Analysis
                        </h4>
                        
                        <div className="space-y-4">
                          <div>
                            <div className="text-sm font-medium text-gray-700 mb-2">Strategic Reasoning</div>
                            <p className="text-gray-600 text-sm">{lead.analysis.reasoning}</p>
                          </div>
                          
                          <div className="grid md:grid-cols-2 gap-4">
                            <div>
                              <div className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                                <Zap className="h-4 w-4 text-green-600" />
                                Key Synergies
                              </div>
                              <ul className="text-sm text-gray-600 space-y-1">
                                {lead.analysis.synergies.map((synergy, idx) => (
                                  <li key={idx} className="flex items-start gap-2">
                                    <span className="text-green-600 mt-1">•</span>
                                    <span>{synergy}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                            
                            <div>
                              <div className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                                <AlertCircle className="h-4 w-4 text-red-600" />
                                Key Risks
                              </div>
                              <ul className="text-sm text-gray-600 space-y-1">
                                {lead.analysis.risks.map((risk, idx) => (
                                  <li key={idx} className="flex items-start gap-2">
                                    <span className="text-red-600 mt-1">•</span>
                                    <span>{risk}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                          
                          <div className="grid md:grid-cols-3 gap-4 pt-2 border-t border-gray-200">
                            <div className="text-center">
                              <div className="text-xs text-gray-500 uppercase tracking-wide">Integration</div>
                              <div className="font-medium text-gray-900">{lead.analysis.integrationComplexity}</div>
                            </div>
                            <div className="text-center">
                              <div className="text-xs text-gray-500 uppercase tracking-wide">Time to Value</div>
                              <div className="font-medium text-gray-900">{lead.analysis.timeToValue}</div>
                            </div>
                            <div className="text-center">
                              <div className="text-xs text-gray-500 uppercase tracking-wide">Strategic Value</div>
                              <div className="font-medium text-gray-900">{lead.analysis.strategicValue}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            {companies.length === 0 && (
              <div className="text-center py-12">
                <Building className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Companies Added</h3>
                <p className="text-gray-600 mb-6">
                  Add target companies to begin your M&A strategic analysis
                </p>
                <button
                  onClick={() => setShowAddCompany(true)}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center gap-2 mx-auto"
                >
                  <span>+</span>
                  Add Your First Company
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MAAcquisitionTool;
              
