// Complete Mental Health Assessment Data
// All standardized tests with proper scoring logic

export const ASSESSMENT_DATA = {
  // 1. Stress & Anxiety
  pss: {
    name: 'Perceived Stress Scale (PSS)',
    category: 'Stress & Anxiety',
    questions: [
      "In the last month, how often have you been upset because of something that happened unexpectedly?",
      "In the last month, how often have you felt that you were unable to control the important things in your life?",
      "In the last month, how often have you felt nervous and 'stressed'?",
      "In the last month, how often have you felt confident about your ability to handle your personal problems?",
      "In the last month, how often have you felt that things were going your way?",
      "In the last month, how often have you found that you could not cope with all the things that you had to do?",
      "In the last month, how often have you been able to control irritations in your life?",
      "In the last month, how often have you felt that you were on top of things?",
      "In the last month, how often have you been angered because of things that were outside of your control?",
      "In the last month, how often have you felt difficulties were piling up so high that you could not overcome them?"
    ],
    options: [
      { value: 0, label: "Never", points: 0 },
      { value: 1, label: "Almost Never", points: 1 },
      { value: 2, label: "Sometimes", points: 2 },
      { value: 3, label: "Fairly Often", points: 3 },
      { value: 4, label: "Very Often", points: 4 }
    ],
    reverseScored: [3, 4, 6, 7],
    maxScore: 40,
    getSeverity: (score) => {
      if (score <= 13) return { level: 'Low Stress', color: 'text-green-600', bg: 'bg-green-50' };
      if (score <= 26) return { level: 'Moderate Stress', color: 'text-yellow-600', bg: 'bg-yellow-50' };
      return { level: 'High Stress', color: 'text-red-600', bg: 'bg-red-50' };
    }
  },

  gad7: {
    name: 'Generalized Anxiety Disorder Scale (GAD-7)',
    category: 'Stress & Anxiety',
    questions: [
      "Feeling nervous, anxious, or on edge",
      "Not being able to stop or control worrying",
      "Worrying too much about different things",
      "Trouble relaxing",
      "Being so restless that it's hard to sit still",
      "Becoming easily annoyed or irritable",
      "Feeling afraid as if something awful might happen"
    ],
    options: [
      { value: 0, label: "Not at all", points: 0 },
      { value: 1, label: "Several days", points: 1 },
      { value: 2, label: "More than half the days", points: 2 },
      { value: 3, label: "Nearly every day", points: 3 }
    ],
    maxScore: 21,
    getSeverity: (score) => {
      if (score <= 4) return { level: 'Minimal Anxiety', color: 'text-green-600', bg: 'bg-green-50' };
      if (score <= 9) return { level: 'Mild Anxiety', color: 'text-yellow-600', bg: 'bg-yellow-50' };
      if (score <= 14) return { level: 'Moderate Anxiety', color: 'text-orange-600', bg: 'bg-orange-50' };
      return { level: 'Severe Anxiety', color: 'text-red-600', bg: 'bg-red-50' };
    }
  },

  // 2. Depression & Mood Disorders
  phq9: {
    name: 'Patient Health Questionnaire (PHQ-9)',
    category: 'Depression & Mood Disorders',
    questions: [
      "Little interest or pleasure in doing things",
      "Feeling down, depressed, or hopeless",
      "Trouble falling or staying asleep, or sleeping too much",
      "Feeling tired or having little energy",
      "Poor appetite or overeating",
      "Feeling bad about yourself or that you are a failure or have let yourself or your family down",
      "Trouble concentrating on things, such as reading the newspaper or watching television",
      "Moving or speaking so slowly that other people could have noticed. Or the opposite - being so fidgety or restless that you have been moving around a lot more than usual",
      "Thoughts that you would be better off dead, or of hurting yourself"
    ],
    options: [
      { value: 0, label: "Not at all", points: 0 },
      { value: 1, label: "Several days", points: 1 },
      { value: 2, label: "More than half the days", points: 2 },
      { value: 3, label: "Nearly every day", points: 3 }
    ],
    maxScore: 27,
    getSeverity: (score) => {
      if (score <= 4) return { level: 'Minimal Depression', color: 'text-green-600', bg: 'bg-green-50' };
      if (score <= 9) return { level: 'Mild Depression', color: 'text-yellow-600', bg: 'bg-yellow-50' };
      if (score <= 14) return { level: 'Moderate Depression', color: 'text-orange-600', bg: 'bg-orange-50' };
      if (score <= 19) return { level: 'Moderately Severe Depression', color: 'text-red-600', bg: 'bg-red-50' };
      return { level: 'Severe Depression', color: 'text-red-700', bg: 'bg-red-100' };
    }
  },

  // 3. Confidence & Personality Control
  rses: {
    name: 'Rosenberg Self-Esteem Scale (RSES)',
    category: 'Confidence & Personality Control',
    questions: [
      "On the whole, I am satisfied with myself.",
      "At times, I think I am no good at all.",
      "I feel that I have a number of good qualities.",
      "I am able to do things as well as most other people.",
      "I feel I do not have much to be proud of.",
      "I certainly feel useless at times.",
      "I feel that I'm a person of worth, at least on an equal plane with others.",
      "I wish I could have more respect for myself.",
      "All in all, I am inclined to feel that I am a failure.",
      "I take a positive attitude toward myself."
    ],
    options: [
      { value: 0, label: "Strongly Disagree", points: 0 },
      { value: 1, label: "Disagree", points: 1 },
      { value: 2, label: "Agree", points: 2 },
      { value: 3, label: "Strongly Agree", points: 3 }
    ],
    reverseScored: [1, 4, 5, 7, 8],
    maxScore: 30,
    getSeverity: (score) => {
      if (score >= 25) return { level: 'High Self-Esteem', color: 'text-green-600', bg: 'bg-green-50' };
      if (score >= 15) return { level: 'Normal Self-Esteem', color: 'text-yellow-600', bg: 'bg-yellow-50' };
      return { level: 'Low Self-Esteem', color: 'text-red-600', bg: 'bg-red-50' };
    }
  },

  // 4. Emotional Stability & Personality Traits
  ders: {
    name: 'Difficulties in Emotion Regulation Scale (DERS)',
    category: 'Emotional Stability & Personality Traits',
    questions: [
      "I am clear about my feelings.",
      "I pay attention to how I feel.",
      "I experience my emotions as overwhelming and out of control.",
      "I have no idea how I am feeling.",
      "I have difficulty making sense out of my feelings.",
      "I am attentive to my feelings.",
      "I know exactly how I am feeling.",
      "I care about what I am feeling.",
      "I am confused about how I feel.",
      "When I am upset, I acknowledge my emotions.",
      "When I am upset, I become angry with myself for feeling that way.",
      "When I am upset, I become embarrassed for feeling that way.",
      "When I am upset, I have difficulty getting work done.",
      "When I am upset, I become out of control.",
      "When I am upset, I believe that I will remain that way for a long time.",
      "When I am upset, I believe that I'll end up doing something I regret.",
      "When I am upset, I have difficulty focusing on other things.",
      "When I am upset, I feel out of control.",
      "When I am upset, I have difficulty concentrating.",
      "When I am upset, I have difficulty controlling my behaviors.",
      "When I am upset, I believe that there is nothing I can do to make myself feel better.",
      "When I am upset, I lose control over my behaviors.",
      "When I am upset, I have difficulty returning to normal.",
      "When I am upset, my emotions feel overwhelming.",
      "When I am upset, I can't prevent myself from doing things I shouldn't do.",
      "When I am upset, I feel guilty for feeling that way.",
      "When I am upset, I feel ashamed for feeling that way.",
      "When I am upset, I believe my emotions are valid and important.",
      "When I am upset, I become irritated with myself for feeling that way.",
      "When I am upset, I start to feel very bad about myself.",
      "When I am upset, I believe that most people would be able to control their emotions better than I can.",
      "When I am upset, I believe that I am weak for feeling that way.",
      "When I am upset, I have difficulty calming down.",
      "When I am upset, I know that I can find a way to eventually feel better.",
      "When I am upset, I can find a way to feel better.",
      "When I am upset, I can change the way I feel.",
      "When I am upset, I believe that I can influence my emotions."
    ],
    options: [
      { value: 0, label: "Almost Never (0-10%)", points: 1 },
      { value: 1, label: "Sometimes (11-35%)", points: 2 },
      { value: 2, label: "About Half the Time (36-65%)", points: 3 },
      { value: 3, label: "Most of the Time (66-90%)", points: 4 },
      { value: 4, label: "Almost Always (91-100%)", points: 5 }
    ],
    reverseScored: [0, 1, 5, 6, 7, 9, 27, 32, 33, 34, 35],
    maxScore: 180,
    getSeverity: (score) => {
      const avgScore = score / 36;
      if (avgScore <= 2.5) return { level: 'Good Emotion Regulation', color: 'text-green-600', bg: 'bg-green-50' };
      if (avgScore <= 3.5) return { level: 'Moderate Emotion Regulation', color: 'text-yellow-600', bg: 'bg-yellow-50' };
      return { level: 'Poor Emotion Regulation', color: 'text-red-600', bg: 'bg-red-50' };
    }
  },

  // 5. Decision-Making & Cognitive Functioning
  bis11: {
    name: 'Barratt Impulsiveness Scale (BIS-11)',
    category: 'Decision-Making & Cognitive Functioning',
    questions: [
      "I plan tasks carefully.",
      "I do things without thinking.",
      "I make-up my mind quickly.",
      "I am happy-go-lucky.",
      "I don't \"pay attention\".",
      "I have \"racing\" thoughts.",
      "I plan for job security.",
      "I say things without thinking.",
      "I like to think about complex problems.",
      "I change jobs.",
      "I act on impulse.",
      "I get easily bored when solving thought problems.",
      "I act on the spur of the moment.",
      "I am a careful thinker.",
      "I plan trips well ahead of time.",
      "I am self controlled.",
      "I concentrate easily.",
      "I save regularly.",
      "I \"squirm\" at plays or lectures.",
      "I am a steady thinker.",
      "I change residences.",
      "I buy things on impulse.",
      "I can only think about one thing at a time.",
      "I change hobbies.",
      "I spend or charge more than I earn.",
      "I often have extraneous thoughts when thinking.",
      "I am more interested in the present than the future.",
      "I am restless at the theater or lectures.",
      "I like puzzles.",
      "I am future oriented."
    ],
    options: [
      { value: 0, label: "Rarely/Never", points: 1 },
      { value: 1, label: "Occasionally", points: 2 },
      { value: 2, label: "Often", points: 3 },
      { value: 3, label: "Almost Always/Always", points: 4 }
    ],
    reverseScored: [0, 6, 8, 9, 13, 14, 15, 16, 17, 19, 28, 29],
    maxScore: 120,
    getSeverity: (score) => {
      if (score <= 60) return { level: 'Low Impulsivity', color: 'text-green-600', bg: 'bg-green-50' };
      if (score <= 80) return { level: 'Moderate Impulsivity', color: 'text-yellow-600', bg: 'bg-yellow-50' };
      return { level: 'High Impulsivity', color: 'text-red-600', bg: 'bg-red-50' };
    }
  },

  // 6. Social Relationships & Interpersonal Issues
  ucla_loneliness: {
    name: 'UCLA Loneliness Scale',
    category: 'Social Relationships & Interpersonal Issues',
    questions: [
      "I feel in tune with the people around me.",
      "I lack companionship.",
      "There is no one I can turn to.",
      "I do not feel alone.",
      "I feel part of a group of friends.",
      "I have friends with whom I can talk about my problems.",
      "There are people who really understand me.",
      "I am no longer close to anyone.",
      "My interests and ideas are not shared by those around me.",
      "I am an outgoing person.",
      "People are around me but not with me.",
      "I feel left out.",
      "My social relationships are superficial.",
      "No one really knows me well.",
      "I feel isolated from others.",
      "I can find companionship when I want it.",
      "I am unhappy being so withdrawn.",
      "People are generally unfriendly toward me.",
      "I do not feel shy.",
      "I am able to reach out and communicate with those around me."
    ],
    options: [
      { value: 0, label: "Never", points: 1 },
      { value: 1, label: "Rarely", points: 2 },
      { value: 2, label: "Sometimes", points: 3 },
      { value: 3, label: "Often", points: 4 }
    ],
    reverseScored: [0, 3, 4, 5, 6, 9, 15, 19],
    maxScore: 80,
    getSeverity: (score) => {
      if (score <= 30) return { level: 'Low Loneliness', color: 'text-green-600', bg: 'bg-green-50' };
      if (score <= 50) return { level: 'Moderate Loneliness', color: 'text-yellow-600', bg: 'bg-yellow-50' };
      return { level: 'High Loneliness', color: 'text-red-600', bg: 'bg-red-50' };
    }
  },

  // 7. Sleep Issues
  psqi: {
    name: 'Pittsburgh Sleep Quality Index (PSQI)',
    category: 'Sleep Issues',
    questions: [
      "During the past month, what time have you usually gone to bed at night?",
      "During the past month, how long (in minutes) has it usually taken you to fall asleep each night?",
      "During the past month, what time have you usually gotten up in the morning?",
      "During the past month, how many hours of actual sleep did you get at night?",
      "During the past month, how often have you had trouble sleeping because you...",
      "...cannot get to sleep within 30 minutes?",
      "...wake up in the middle of the night or early morning?",
      "...have to get up to use the bathroom?",
      "...cannot breathe comfortably?",
      "...cough or snore loudly?",
      "...feel too cold?",
      "...feel too hot?",
      "...had bad dreams?",
      "...have pain?",
      "During the past month, how often have you taken medicine to help you sleep?",
      "During the past month, how often have you had trouble staying awake while driving, eating meals, or engaging in social activity?",
      "During the past month, how much of a problem has it been for you to keep up enough enthusiasm to get things done?",
      "During the past month, how would you rate your overall sleep quality?"
    ],
    options: [
      { value: 0, label: "Not during the past month", points: 0 },
      { value: 1, label: "Less than once a week", points: 1 },
      { value: 2, label: "Once or twice a week", points: 2 },
      { value: 3, label: "Three or more times a week", points: 3 }
    ],
    maxScore: 21,
    getSeverity: (score) => {
      if (score <= 5) return { level: 'Good Sleep Quality', color: 'text-green-600', bg: 'bg-green-50' };
      if (score <= 10) return { level: 'Fair Sleep Quality', color: 'text-yellow-600', bg: 'bg-yellow-50' };
      return { level: 'Poor Sleep Quality', color: 'text-red-600', bg: 'bg-red-50' };
    }
  },

  // 8. Behavioral & Lifestyle Factors
  eat26: {
    name: 'Eating Attitude Test (EAT-26)',
    category: 'Behavioral & Lifestyle Factors',
    questions: [
      "I am terrified about being overweight.",
      "I avoid eating when I am hungry.",
      "I find myself preoccupied with food.",
      "I have gone on eating binges where I feel that I may not be able to stop.",
      "I cut my food into small pieces.",
      "I am aware of the calorie content of foods that I eat.",
      "I particularly avoid food with a high carbohydrate content (i.e. bread, rice, potatoes, etc.)",
      "I feel that others would prefer if I ate more.",
      "I vomit after I have eaten.",
      "I feel extremely guilty after eating.",
      "I am preoccupied with a desire to be thinner.",
      "I think about burning up calories when I exercise.",
      "Other people think that I am too thin.",
      "I am preoccupied with the thought of having fat on my body.",
      "I take longer than others to eat my meals.",
      "I avoid foods with sugar in them.",
      "I eat diet foods.",
      "I feel that food controls my life.",
      "I display self-control around food.",
      "I feel that others pressure me to eat.",
      "I give too much time and thought to food.",
      "I feel uncomfortable after eating sweets.",
      "I engage in dieting behavior.",
      "I like my stomach to be empty.",
      "I have the impulse to vomit after meals.",
      "I enjoy trying new rich foods."
    ],
    options: [
      { value: 0, label: "Never", points: 0 },
      { value: 1, label: "Rarely", points: 1 },
      { value: 2, label: "Sometimes", points: 2 },
      { value: 3, label: "Often", points: 3 },
      { value: 4, label: "Usually", points: 4 },
      { value: 5, label: "Always", points: 5 }
    ],
    reverseScored: [7, 12, 19, 25],
    maxScore: 120,
    getSeverity: (score) => {
      if (score <= 10) return { level: 'Normal Eating Attitudes', color: 'text-green-600', bg: 'bg-green-50' };
      if (score <= 20) return { level: 'At Risk for Eating Disorder', color: 'text-yellow-600', bg: 'bg-yellow-50' };
      return { level: 'High Risk for Eating Disorder', color: 'text-red-600', bg: 'bg-red-50' };
    }
  },

  // 9. Digital Well-Being & Technology Impact
  iat: {
    name: 'Internet Addiction Test (IAT)',
    category: 'Digital Well-Being & Technology Impact',
    questions: [
      "How often do you find that you stay online longer than you intended?",
      "How often do you neglect household chores to spend more time online?",
      "How often do you prefer the excitement of the Internet to intimacy with your partner?",
      "How often do you form new relationships with fellow online users?",
      "How often do others in your life complain to you about the amount of time you spend online?",
      "How often do your grades or school work suffer because of the amount of time you spend online?",
      "How often do you check your e-mail before something else that you need to do?",
      "How often does your job performance or productivity suffer because of the Internet?",
      "How often do you become defensive or secretive when anyone asks you what you do online?",
      "How often do you block out disturbing thoughts about your life with soothing thoughts of the Internet?",
      "How often do you find yourself anticipating when you will go online again?",
      "How often do you fear that life without the Internet would be boring, empty, and joyless?",
      "How often do you snap, yell, or act annoyed if someone bothers you while you are online?",
      "How often do you lose sleep due to late-night log-ins?",
      "How often do you feel preoccupied with the Internet when off-line, or fantasize about being online?",
      "How often do you find yourself saying 'just a few more minutes' when online?",
      "How often do you try to cut down the amount of time you spend online and fail?",
      "How often do you try to hide how long you've been online?",
      "How often do you choose to spend more time online over going out with others?",
      "How often do you feel depressed, moody, or nervous when you are off-line, which goes away once you are back online?"
    ],
    options: [
      { value: 0, label: "Does not apply", points: 1 },
      { value: 1, label: "Rarely", points: 2 },
      { value: 2, label: "Occasionally", points: 3 },
      { value: 3, label: "Frequently", points: 4 },
      { value: 4, label: "Often", points: 5 },
      { value: 5, label: "Always", points: 6 }
    ],
    maxScore: 120,
    getSeverity: (score) => {
      if (score <= 30) return { level: 'Normal', color: 'text-green-600', bg: 'bg-green-50' };
      if (score <= 49) return { level: 'Mild Addiction', color: 'text-yellow-600', bg: 'bg-yellow-50' };
      if (score <= 79) return { level: 'Moderate Addiction', color: 'text-orange-600', bg: 'bg-orange-50' };
      return { level: 'Severe Addiction', color: 'text-red-600', bg: 'bg-red-50' };
    }
  },

  sassv: {
    name: 'Smartphone Addiction Scale - Short Version (SAS-SV)',
    category: 'Digital Well-Being & Technology Impact',
    questions: [
      "Missing planned work due to smartphone use",
      "Having a hard time concentrating in class, while doing assignments, or while working due to smartphone use",
      "Feeling pain in the wrists or at the back of the neck while using a smartphone",
      "Won't be able to stand not having a smartphone",
      "Feeling impatient and fretful when I am not holding my smartphone",
      "Having my smartphone in my mind even when I am not using it",
      "I will never give up using my smartphone even when my daily life is already greatly affected by it",
      "Constantly checking my smartphone so as not to miss conversations between other people on Twitter or Facebook",
      "Using my smartphone longer than I had intended",
      "The people around me tell me that I use my smartphone too much"
    ],
    options: [
      { value: 0, label: "Strongly disagree", points: 1 },
      { value: 1, label: "Disagree", points: 2 },
      { value: 2, label: "Neutral", points: 3 },
      { value: 3, label: "Agree", points: 4 },
      { value: 4, label: "Strongly agree", points: 5 }
    ],
    maxScore: 50,
    getSeverity: (score) => {
      if (score < 31) return { level: 'Low Use', color: 'text-green-600', bg: 'bg-green-50' };
      if (score <= 43) return { level: 'Moderate Addiction', color: 'text-yellow-600', bg: 'bg-yellow-50' };
      return { level: 'High Addiction', color: 'text-red-600', bg: 'bg-red-50' };
    }
  }
};

// Helper functions for scoring
export const calculateScore = (testKey, answers) => {
  const test = ASSESSMENT_DATA[testKey];
  if (!test) return 0;

  let totalScore = 0;
  answers.forEach((answer, index) => {
    let points = test.options[answer]?.points || 0;

    // Apply reverse scoring if needed
    if (test.reverseScored && test.reverseScored.includes(index)) {
      const maxPoints = Math.max(...test.options.map(opt => opt.points));
      points = maxPoints - points;
    }

    totalScore += points;
  });

  return totalScore;
};

export const getOverallWellnessIndex = (results) => {
  if (!results || results.length === 0) return 0;

  let totalScore = 0;
  let maxPossibleScore = 0;

  results.forEach(result => {
    const test = ASSESSMENT_DATA[result.testKey];
    if (test) {
      // Convert to percentage (lower scores = better wellness)
      const percentage = (result.score / test.maxScore) * 100;
      // Invert so higher wellness = better score
      const wellnessScore = 100 - percentage;
      totalScore += wellnessScore;
      maxPossibleScore += 100;
    }
  });

  return Math.round((totalScore / maxPossibleScore) * 100);
};

export const getWellnessRecommendations = (wellnessIndex) => {
  if (wellnessIndex >= 80) {
    return {
      level: 'Excellent',
      color: 'text-green-600',
      bg: 'bg-green-50',
      message: 'Your mental wellness is excellent! Keep maintaining healthy habits.',
      suggestions: [
        'Continue your current healthy lifestyle',
        'Consider mentoring others',
        'Stay connected with supportive relationships'
      ]
    };
  } else if (wellnessIndex >= 60) {
    return {
      level: 'Good',
      color: 'text-green-500',
      bg: 'bg-green-50',
      message: 'Your mental wellness is good. Focus on maintaining balance.',
      suggestions: [
        'Practice daily mindfulness or meditation',
        'Maintain regular exercise routine',
        'Ensure adequate sleep (7-9 hours)',
        'Stay socially connected'
      ]
    };
  } else if (wellnessIndex >= 40) {
    return {
      level: 'Fair',
      color: 'text-yellow-600',
      bg: 'bg-yellow-50',
      message: 'Your mental wellness needs attention. Consider professional support.',
      suggestions: [
        'Consult a mental health professional',
        'Develop a daily routine with self-care activities',
        'Limit screen time and social media',
        'Practice stress management techniques',
        'Consider therapy or counseling'
      ]
    };
  } else {
    return {
      level: 'Needs Attention',
      color: 'text-red-600',
      bg: 'bg-red-50',
      message: 'Your mental wellness requires immediate professional attention.',
      suggestions: [
        'Seek immediate professional help',
        'Contact a crisis hotline if needed',
        'Consider intensive therapy',
        'Build a strong support network',
        'Develop coping strategies with professional guidance'
      ]
    };
  }
};
