import { useState, useRef, useEffect } from 'react';
import AnimatedPage from '../components/AnimatedPage';
import { HiPaperAirplane, HiChip, HiUser, HiExclamationCircle } from 'react-icons/hi';
import { diagnosisAPI } from '../services/api';

const AIChatAssistant = () => {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello! I\'m your AI veterinary assistant. Describe any symptoms or ask about cattle health, and I\'ll help you with a preliminary assessment.' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const res = await diagnosisAPI.aiAnalyze({ symptoms: userMsg });
      const analysis = res.data.data;
      const response = analysis.possibleDiseases?.length > 0
        ? `**Possible Conditions:**\n${analysis.possibleDiseases.map((d, i) => `${i + 1}. **${d.disease}** (${d.probability}% confidence) - ${d.description}`).join('\n')}\n\n**Health Score:** ${analysis.healthScore}/100\n\n**Recommended Treatment:** ${analysis.recommendedTreatment}\n\n**Prevention:** ${analysis.preventionTips}`
        : 'I couldn\'t identify specific conditions based on the symptoms described. Please consult a veterinarian for a thorough examination.';
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'I apologize, but I encountered an error processing your request. Please try again or consult a veterinarian.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <AnimatedPage>
      <div className="flex flex-col h-[calc(100vh-10rem)]">
        <div className="mb-4">
          <h1 className="page-title">AI Chat Assistant</h1>
          <p className="text-gray-500 mt-1">Ask anything about cattle health</p>
        </div>

        <div className="flex-1 card overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <HiChip className="w-4 h-4 text-primary-600" />
                  </div>
                )}
                <div className={`max-w-[80%] rounded-2xl p-4 ${
                  msg.role === 'user'
                    ? 'bg-primary-600 text-white rounded-br-md'
                    : 'bg-gray-50 border border-gray-100 rounded-bl-md'
                }`}>
                  <p className="text-sm whitespace-pre-line leading-relaxed">{msg.content}</p>
                </div>
                {msg.role === 'user' && (
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                    <HiUser className="w-4 h-4 text-gray-600" />
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <HiChip className="w-4 h-4 text-primary-600" />
                </div>
                <div className="bg-gray-50 border border-gray-100 rounded-2xl rounded-bl-md p-4">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-gray-100 p-4">
            <div className="flex gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Describe symptoms or ask a question..."
                className="input-field resize-none"
                rows={2}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || loading}
                className="btn-primary !px-4 !py-2 flex items-center justify-center self-end"
              >
                <HiPaperAirplane className="w-5 h-5 rotate-90" />
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
              <HiExclamationCircle className="w-3 h-3" />
              AI-powered preliminary analysis. Always consult a veterinarian.
            </p>
          </div>
        </div>
      </div>
    </AnimatedPage>
  );
};

export default AIChatAssistant;