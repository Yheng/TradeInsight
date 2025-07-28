import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import LoadingSpinner from '@/components/common/LoadingSpinner';

interface OnboardingStep {
  id: number;
  title: string;
  description: string;
  component: React.ReactNode;
}

interface FeedbackFormData {
  rating: number;
  comment: string;
}

const OnboardingPage = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackData, setFeedbackData] = useState<FeedbackFormData>({ rating: 0, comment: '' });

  // MT5 Connection Form Data
  const [mt5Credentials, setMt5Credentials] = useState({
    login: '',
    password: '',
    server: ''
  });

  // Risk Profile Form Data
  const [riskProfile, setRiskProfile] = useState({
    maxLeverage: 100,
    riskTolerance: 'medium',
    maxDrawdown: 10.0
  });

  const handleMT5Connect = async () => {
    if (!mt5Credentials.login || !mt5Credentials.password || !mt5Credentials.server) {
      toast.error('Please fill in all MT5 credentials');
      return;
    }

    setIsLoading(true);
    try {
      // TODO: Implement MT5 connection API call
      // const response = await apiService.connectMT5(mt5Credentials);
      // if (response.success) {
        toast.success('Connected to MT5 successfully!');
        setShowFeedback(true);
      // } else {
      //   toast.error(response.error || 'Failed to connect to MT5');
      // }
    } catch (error) {
      toast.error('Connection failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFeedbackSubmit = async () => {
    try {
      // TODO: Implement feedback submission API call
      // await apiService.submitFeedback({
      //   step: `step_${currentStep}`,
      //   rating: feedbackData.rating,
      //   comment: feedbackData.comment
      // });
      
      setShowFeedback(false);
      setFeedbackData({ rating: 0, comment: '' });
      
      if (currentStep < 3) {
        setCurrentStep(currentStep + 1);
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      toast.error('Failed to submit feedback');
    }
  };

  const handleSkipFeedback = () => {
    setShowFeedback(false);
    setFeedbackData({ rating: 0, comment: '' });
    
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else {
      navigate('/dashboard');
    }
  };

  const MT5ConnectionStep = () => (
    <div className="max-w-md mx-auto">
      <div className="mb-6">
        <iframe
          src="https://www.youtube.com/embed/dQw4w9WgXcQ"
          width="320"
          height="180"
          className="mx-auto rounded-lg"
          title="MT5 Setup Video"
          aria-label="MT5 Setup Video"
        />
      </div>
      
      <div className="text-white text-center mb-6">
        <p className="text-sm leading-relaxed">
          Connect your MetaTrader 5 account to start analyzing your trading data. 
          You can get these credentials from your broker's client portal.
        </p>
      </div>

      <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleMT5Connect(); }}>
        <div>
          <label htmlFor="accountId" className="block text-sm font-medium text-white mb-1">
            Account ID
          </label>
          <input
            type="text"
            id="accountId"
            placeholder="12345678"
            value={mt5Credentials.login}
            onChange={(e) => setMt5Credentials({ ...mt5Credentials, login: e.target.value })}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            aria-label="Account ID"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-white mb-1">
            Password
          </label>
          <input
            type="password"
            id="password"
            value={mt5Credentials.password}
            onChange={(e) => setMt5Credentials({ ...mt5Credentials, password: e.target.value })}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            aria-label="Password"
          />
        </div>

        <div>
          <label htmlFor="server" className="block text-sm font-medium text-white mb-1">
            Server
          </label>
          <select
            id="server"
            value={mt5Credentials.server}
            onChange={(e) => setMt5Credentials({ ...mt5Credentials, server: e.target.value })}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            aria-label="Server"
          >
            <option value="">Select Server</option>
            <option value="ICMarkets-Demo01">ICMarkets-Demo01</option>
            <option value="ICMarkets-Live01">ICMarkets-Live01</option>
            <option value="Pepperstone-Demo">Pepperstone-Demo</option>
            <option value="Pepperstone-Live">Pepperstone-Live</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white font-medium py-2 px-4 rounded-md transition-colors"
        >
          {isLoading ? <LoadingSpinner size="sm" /> : 'Connect'}
        </button>
      </form>
    </div>
  );

  const RiskProfileStep = () => (
    <div className="max-w-md mx-auto">
      <div className="text-white text-center mb-6">
        <p className="text-sm leading-relaxed">
          Set your risk preferences to get personalized trading recommendations and alerts.
        </p>
      </div>

      <form className="space-y-4">
        <div>
          <label htmlFor="maxLeverage" className="block text-sm font-medium text-white mb-1">
            Maximum Leverage (1x - 500x)
          </label>
          <input
            type="number"
            id="maxLeverage"
            min="1"
            max="500"
            value={riskProfile.maxLeverage}
            onChange={(e) => setRiskProfile({ ...riskProfile, maxLeverage: parseInt(e.target.value) })}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-blue-600 focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="riskTolerance" className="block text-sm font-medium text-white mb-1">
            Risk Tolerance
          </label>
          <select
            id="riskTolerance"
            value={riskProfile.riskTolerance}
            onChange={(e) => setRiskProfile({ ...riskProfile, riskTolerance: e.target.value })}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-blue-600 focus:border-transparent"
          >
            <option value="low">Conservative</option>
            <option value="medium">Moderate</option>
            <option value="high">Aggressive</option>
          </select>
        </div>

        <div>
          <label htmlFor="maxDrawdown" className="block text-sm font-medium text-white mb-1">
            Maximum Drawdown (%)
          </label>
          <input
            type="number"
            id="maxDrawdown"
            min="1"
            max="50"
            step="0.1"
            value={riskProfile.maxDrawdown}
            onChange={(e) => setRiskProfile({ ...riskProfile, maxDrawdown: parseFloat(e.target.value) })}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-blue-600 focus:border-transparent"
          />
        </div>
      </form>
    </div>
  );

  const AlertsSetupStep = () => (
    <div className="max-w-md mx-auto">
      <div className="text-white text-center mb-6">
        <p className="text-sm leading-relaxed">
          Configure when and how you want to receive trading alerts and notifications.
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
          <span className="text-white">Email Notifications</span>
          <input type="checkbox" className="toggle" defaultChecked />
        </div>

        <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
          <span className="text-white">Risk Alerts</span>
          <input type="checkbox" className="toggle" defaultChecked />
        </div>

        <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
          <span className="text-white">Drawdown Warnings</span>
          <input type="checkbox" className="toggle" defaultChecked />
        </div>
      </div>
    </div>
  );

  const steps: OnboardingStep[] = [
    {
      id: 1,
      title: 'Connect MT5',
      description: 'Link your MetaTrader 5 account',
      component: <MT5ConnectionStep />
    },
    {
      id: 2,
      title: 'Risk Profile',
      description: 'Set your trading preferences',
      component: <RiskProfileStep />
    },
    {
      id: 3,
      title: 'Alerts Setup',
      description: 'Configure notifications',
      component: <AlertsSetupStep />
    }
  ];

  const currentStepData = steps.find(step => step.id === currentStep);

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="text-white text-xl font-semibold">TradeInsight</div>
          <div className="text-gray-400 text-sm">
            EN
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-2xl">
          {/* Step Indicator */}
          <div className="text-center mb-8">
            <h1 className="text-white text-2xl font-semibold mb-2">
              Step {currentStep}/3: {currentStepData?.title}
            </h1>
            <p className="text-gray-400 text-sm">{currentStepData?.description}</p>
          </div>

          {/* Step Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {currentStepData?.component}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex justify-center mt-8 space-x-4">
            {currentStep > 1 && (
              <button
                onClick={() => setCurrentStep(currentStep - 1)}
                className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-colors"
              >
                Back
              </button>
            )}
            
            {currentStep < 3 ? (
              <button
                onClick={() => setCurrentStep(currentStep + 1)}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
              >
                Next
              </button>
            ) : (
              <button
                onClick={() => navigate('/dashboard')}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors"
              >
                Complete Setup
              </button>
            )}
          </div>
        </div>
      </main>

      {/* Feedback Modal */}
      <AnimatePresence>
        {showFeedback && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-900 rounded-lg p-6 w-full max-w-md"
            >
              <h3 className="text-white text-lg font-semibold mb-4">Rate this step</h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-white mb-2">
                  Rating (1-5 stars)
                </label>
                <div className="flex space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setFeedbackData({ ...feedbackData, rating: star })}
                      className={`text-2xl ${
                        star <= feedbackData.rating ? 'text-yellow-400' : 'text-gray-600'
                      } hover:text-yellow-400 transition-colors`}
                      aria-label={`Rate ${star} stars`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <label htmlFor="feedback" className="block text-sm font-medium text-white mb-2">
                  Feedback (optional)
                </label>
                <textarea
                  id="feedback"
                  maxLength={100}
                  value={feedbackData.comment}
                  onChange={(e) => setFeedbackData({ ...feedbackData, comment: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  rows={3}
                  aria-label="Feedback"
                  placeholder="Tell us about your experience..."
                />
                <div className="text-xs text-gray-400 mt-1">
                  {feedbackData.comment.length}/100 characters
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={handleFeedbackSubmit}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
                >
                  Submit Feedback
                </button>
                <button
                  onClick={handleSkipFeedback}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
                >
                  Skip
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="bg-gray-800 border-t border-gray-700 px-6 py-4 text-center">
        <p className="text-gray-500 text-sm">Copyright © 2025 TradeInsight</p>
      </footer>
    </div>
  );
};

export default OnboardingPage;