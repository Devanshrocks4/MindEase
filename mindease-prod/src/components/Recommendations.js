import React from 'react';
import { motion } from 'framer-motion';

const Recommendations = ({ riskLevel, issueType }) => {
  const getRecommendations = (risk, issue) => {
    const baseRecommendations = {
      stress: [
        { title: 'Deep Breathing Exercise', desc: 'Practice 4-7-8 breathing: Inhale for 4 seconds, hold for 7, exhale for 8.', icon: '🫁' },
        { title: 'Progressive Muscle Relaxation', desc: 'Tense and relax each muscle group from toes to head.', icon: '💪' },
        { title: 'Nature Walk', desc: 'Spend 20 minutes in nature to reduce cortisol levels.', icon: '🌳' },
      ],
      depression: [
        { title: 'Gratitude Journaling', desc: 'Write down 3 things you\'re grateful for each day.', icon: '📓' },
        { title: 'Sunlight Exposure', desc: 'Get 15-30 minutes of morning sunlight to boost mood.', icon: '☀️' },
        { title: 'Social Connection', desc: 'Reach out to a friend or loved one for support.', icon: '🤝' },
      ],
      confidence: [
        { title: 'Positive Affirmations', desc: 'Repeat empowering statements like "I am capable and worthy."', icon: '💬' },
        { title: 'Skill Building', desc: 'Learn a new skill or hobby to boost self-esteem.', icon: '🎯' },
        { title: 'Body Language Practice', desc: 'Stand tall with open posture to feel more confident.', icon: '🧍' },
      ],
      emotional: [
        { title: 'Emotional Awareness', desc: 'Label your emotions without judgment to understand them better.', icon: '🧠' },
        { title: 'Mindfulness Meditation', desc: 'Practice being present in the moment without reacting.', icon: '🧘' },
        { title: 'Healthy Boundaries', desc: 'Learn to say no and set limits in relationships.', icon: '🚧' },
      ],
      decision: [
        { title: 'Pros and Cons List', desc: 'Write down advantages and disadvantages of each option.', icon: '⚖️' },
        { title: 'Gut Feeling Check', desc: 'After analysis, trust your intuition.', icon: '🔮' },
        { title: 'Small Steps', desc: 'Break decisions into smaller, manageable actions.', icon: '👣' },
      ],
    };

    const riskMultipliers = {
      Low: 1,
      Moderate: 2,
      High: 3,
    };

    const recommendations = baseRecommendations[issue] || [];
    const count = Math.min(recommendations.length, riskMultipliers[risk]);

    return recommendations.slice(0, count);
  };

  const recommendations = getRecommendations(riskLevel, issueType);

  const quotes = [
    "You are stronger than you know.",
    "Every storm runs out of rain.",
    "Your mental health is a priority.",
    "One day at a time.",
    "You are not alone in this journey.",
  ];

  const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="p-6 bg-gradient-to-br from-lavender to-mint rounded-2xl shadow-lg"
    >
      <h3 className="text-2xl font-bold text-indigo-700 mb-4 font-poppins">Personalized Recommendations</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {recommendations.map((rec, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white p-4 rounded-xl shadow-md hover:shadow-lg transition-shadow"
          >
            <div className="text-3xl mb-2">{rec.icon}</div>
            <h4 className="font-semibold text-gray-800 mb-2">{rec.title}</h4>
            <p className="text-sm text-gray-600">{rec.desc}</p>
          </motion.div>
        ))}
      </div>
      <div className="text-center">
        <p className="text-lg italic text-indigo-600 font-inter">"{randomQuote}"</p>
      </div>
    </motion.div>
  );
};

export default Recommendations;
