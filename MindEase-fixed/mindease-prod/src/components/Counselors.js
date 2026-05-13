import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaUserMd, FaMapMarkerAlt, FaPhone, FaEnvelope, FaVideo, FaCalendarAlt, FaStar, FaSearch } from 'react-icons/fa';
import { db, isFirebaseConfigured } from '../services/firebase';
import { collection, getDocs } from 'firebase/firestore';

const Counselors = ({ userIssue, riskLevel }) => {
  const [counselors, setCounselors] = useState([]);
  const [filteredCounselors, setFilteredCounselors] = useState([]);
  const [filters, setFilters] = useState({ specialty: '', language: '', availability: '', state: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStates, setSelectedStates] = useState(['delhi']); // Default to Delhi

  // List of all Indian states
  const indianStates = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana',
    'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
    'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
    'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi'
  ];

  // Mental Health Resources Data for Delhi and Punjab
  const mentalHealthResources = {
    delhi: {
      emergency: [
        { name: "Delhi Mental Health Helpline", phone: "1800-121-4555", type: "24/7 Crisis Support" },
        { name: "AIIMS Emergency", phone: "011-26594401", type: "Medical Emergency" },
        { name: "Vandrevala Foundation", phone: "9999666555", type: "Suicide Prevention" }
      ],
      hospitals: [
        {
          name: "Institute of Human Behaviour & Allied Sciences (IHBAS)",
          address: "Dilshad Garden, Delhi-110095",
          phone: "011-22114021",
          specialties: ["Psychiatry", "Psychology", "Mental Health"],
          onlineBooking: true,
          doctors: [
            { name: "Dr. Rajesh Sagar", specialty: "Clinical Psychology", experience: "15 years", rating: 4.9 },
            { name: "Dr. Mamta Sood", specialty: "Psychiatry", experience: "12 years", rating: 4.8 }
          ]
        },
        {
          name: "Max Healthcare Saket",
          address: "1,2, Press Enclave Road, Saket, Delhi-110017",
          phone: "011-26515050",
          specialties: ["Mental Health", "Psychiatry", "Counseling"],
          onlineBooking: true,
          doctors: [
            { name: "Dr. Anjali Gupta", specialty: "Clinical Psychology", experience: "10 years", rating: 4.7 },
            { name: "Dr. Vikram Singh", specialty: "Psychiatry", experience: "14 years", rating: 4.8 }
          ]
        },
        {
          name: "Fortis Hospital Shalimar Bagh",
          address: "A Block, Shalimar Bagh, Delhi-110088",
          phone: "011-45302222",
          specialties: ["Mental Health", "Psychology", "Addiction"],
          onlineBooking: true,
          doctors: [
            { name: "Dr. Priya Sharma", specialty: "Addiction Psychiatry", experience: "11 years", rating: 4.6 },
            { name: "Dr. Rohan Kapoor", specialty: "Clinical Psychology", experience: "9 years", rating: 4.7 }
          ]
        }
      ],
      helplines: [
        { name: "Delhi State Mental Health Authority", phone: "011-23378881", services: "Mental Health Support" },
        { name: "Samaritans Delhi", phone: "011-23389090", services: "Emotional Support" },
        { name: "Connecting NGO", phone: "9911900044", services: "Youth Mental Health" }
      ],
      onlinePlatforms: [
        { name: "YourDOST", type: "Online Therapy", website: "yourdost.com", rating: 4.5 },
        { name: "Mfine", type: "Telemedicine", website: "mfine.co", rating: 4.3 },
        { name: "DocsApp", type: "Doctor Consultation", website: "docsapp.in", rating: 4.4 }
      ]
    },
    punjab: {
      emergency: [
        { name: "Punjab Mental Health Helpline", phone: "1800-121-4555", type: "24/7 Crisis Support" },
        { name: "PGIMER Chandigarh", phone: "0172-2755253", type: "Medical Emergency" },
        { name: "Bhai Ghanaiya Ji Charitable Trust", phone: "9876543210", type: "Crisis Intervention" }
      ],
      hospitals: [
        {
          name: "Post Graduate Institute of Medical Education & Research (PGIMER)",
          address: "Sector 12, Chandigarh-160012",
          phone: "0172-2755253",
          specialties: ["Psychiatry", "Clinical Psychology", "Mental Health"],
          onlineBooking: true,
          doctors: [
            { name: "Dr. Savita Malhotra", specialty: "Child Psychiatry", experience: "18 years", rating: 4.9 },
            { name: "Dr. Paramjeet Singh", specialty: "Clinical Psychology", experience: "13 years", rating: 4.8 }
          ]
        },
        {
          name: "Fortis Hospital Mohali",
          address: "Sector 62, Sahibzada Ajit Singh Nagar, Punjab-160062",
          phone: "0172-4692222",
          specialties: ["Mental Health", "Psychiatry", "Counseling"],
          onlineBooking: true,
          doctors: [
            { name: "Dr. Neha Aggarwal", specialty: "Clinical Psychology", experience: "8 years", rating: 4.6 },
            { name: "Dr. Gurpreet Singh", specialty: "Psychiatry", experience: "16 years", rating: 4.9 }
          ]
        },
        {
          name: "Max Super Speciality Hospital",
          address: "Near Civil Hospital, Jalandhar, Punjab-144001",
          phone: "0181-6623333",
          specialties: ["Mental Health", "Psychology", "Addiction Treatment"],
          onlineBooking: true,
          doctors: [
            { name: "Dr. Rajinder Kaur", specialty: "Clinical Psychology", experience: "12 years", rating: 4.7 },
            { name: "Dr. Maninder Singh", specialty: "Addiction Psychiatry", experience: "10 years", rating: 4.5 }
          ]
        }
      ],
      helplines: [
        { name: "Punjab State Mental Health Authority", phone: "0172-2740345", services: "Mental Health Support" },
        { name: "Samaritans Punjab", phone: "0172-2704191", services: "Emotional Support" },
        { name: "Youth Line Punjab", phone: "1098", services: "Youth Counseling" }
      ],
      onlinePlatforms: [
        { name: "Practo", type: "Doctor Consultation", website: "practo.com", rating: 4.6 },
        { name: "1mg", type: "Telemedicine", website: "1mg.com", rating: 4.4 },
        { name: "DocsApp", type: "Online Doctors", website: "docsapp.in", rating: 4.3 }
      ]
    }
  };

  useEffect(() => {
    const fetchCounselors = async () => {
      try {
        let counselorData = [];

        if (isFirebaseConfigured && db) {
          const querySnapshot = await getDocs(collection(db, 'counselors'));
          counselorData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        }

        // Add local counselor data for all states
        const localCounselors = [
          // Delhi Counselors
          {
            id: 1,
            name: 'Dr. Sarah Johnson',
            specialty: 'Stress and Anxiety',
            language: 'English, Hindi',
            availability: 'Weekdays, Online',
            experience: '10 years',
            rating: 4.8,
            bio: 'Specialized in cognitive behavioral therapy for stress management.',
            state: 'Delhi',
            onlineSessions: true,
            phone: '+91-9876543210',
            email: 'dr.sarah@mindease.com'
          },
          {
            id: 2,
            name: 'Dr. Rajesh Kumar',
            specialty: 'Depression',
            language: 'English, Hindi',
            availability: 'Evenings, Weekends',
            experience: '12 years',
            rating: 4.9,
            bio: 'Experienced in treating depression with a holistic approach.',
            state: 'Delhi',
            onlineSessions: true,
            phone: '+91-9876543211',
            email: 'dr.rajesh@mindease.com'
          },
          {
            id: 3,
            name: 'Dr. Priya Sharma',
            specialty: 'Emotional Instability',
            language: 'English, Hindi, Punjabi',
            availability: 'Flexible, Online',
            experience: '8 years',
            rating: 4.7,
            bio: 'Focuses on emotional regulation and relationship counseling.',
            state: 'Delhi',
            onlineSessions: true,
            phone: '+91-9876543212',
            email: 'dr.priya@mindease.com'
          },
          // Punjab Counselors
          {
            id: 4,
            name: 'Dr. Gurpreet Singh',
            specialty: 'Confidence Issues',
            language: 'English, Punjabi, Hindi',
            availability: 'Weekdays, Online',
            experience: '11 years',
            rating: 4.8,
            bio: 'Helps build self-esteem and confidence through positive psychology.',
            state: 'Punjab',
            onlineSessions: true,
            phone: '+91-9876543213',
            email: 'dr.gurpreet@mindease.com'
          },
          {
            id: 5,
            name: 'Dr. Maninder Kaur',
            specialty: 'Decision-Making',
            language: 'English, Punjabi',
            availability: 'Evenings, Online',
            experience: '9 years',
            rating: 4.6,
            bio: 'Specializes in cognitive behavioral therapy for decision-making challenges.',
            state: 'Punjab',
            onlineSessions: true,
            phone: '+91-9876543214',
            email: 'dr.maninder@mindease.com'
          },
          {
            id: 6,
            name: 'Dr. Vikramjeet Singh',
            specialty: 'Sleep Issues',
            language: 'English, Hindi, Punjabi',
            availability: 'Flexible, Online',
            experience: '13 years',
            rating: 4.9,
            bio: 'Expert in sleep disorders and insomnia treatment.',
            state: 'Punjab',
            onlineSessions: true,
            phone: '+91-9876543215',
            email: 'dr.vikramjeet@mindease.com'
          },
          // Maharashtra Counselors
          {
            id: 7,
            name: 'Dr. Amit Patel',
            specialty: 'Stress and Anxiety',
            language: 'English, Hindi, Marathi',
            availability: 'Weekdays, Online',
            experience: '14 years',
            rating: 4.7,
            bio: 'Expert in managing workplace stress and anxiety disorders.',
            state: 'Maharashtra',
            onlineSessions: true,
            phone: '+91-9876543216',
            email: 'dr.amit@mindease.com'
          },
          {
            id: 8,
            name: 'Dr. Sneha Desai',
            specialty: 'Depression',
            language: 'English, Hindi',
            availability: 'Evenings, Online',
            experience: '9 years',
            rating: 4.8,
            bio: 'Specializes in treating depression and mood disorders.',
            state: 'Maharashtra',
            onlineSessions: true,
            phone: '+91-9876543217',
            email: 'dr.sneha@mindease.com'
          },
          // Karnataka Counselors
          {
            id: 9,
            name: 'Dr. Ravi Kumar',
            specialty: 'Sleep Issues',
            language: 'English, Hindi, Kannada',
            availability: 'Flexible, Online',
            experience: '11 years',
            rating: 4.6,
            bio: 'Expert in sleep medicine and insomnia treatment.',
            state: 'Karnataka',
            onlineSessions: true,
            phone: '+91-9876543218',
            email: 'dr.ravi@mindease.com'
          },
          {
            id: 10,
            name: 'Dr. Meera Rao',
            specialty: 'Emotional Instability',
            language: 'English, Hindi',
            availability: 'Weekdays, Online',
            experience: '8 years',
            rating: 4.7,
            bio: 'Focuses on emotional regulation and trauma therapy.',
            state: 'Karnataka',
            onlineSessions: true,
            phone: '+91-9876543219',
            email: 'dr.meera@mindease.com'
          },
          // Tamil Nadu Counselors
          {
            id: 11,
            name: 'Dr. Arjun Krishnan',
            specialty: 'Confidence Issues',
            language: 'English, Tamil, Hindi',
            availability: 'Evenings, Online',
            experience: '12 years',
            rating: 4.8,
            bio: 'Helps build self-confidence and overcome social anxiety.',
            state: 'Tamil Nadu',
            onlineSessions: true,
            phone: '+91-9876543220',
            email: 'dr.arjun@mindease.com'
          },
          {
            id: 12,
            name: 'Dr. Lakshmi Venkatesan',
            specialty: 'Decision-Making',
            language: 'English, Tamil',
            availability: 'Weekends, Online',
            experience: '10 years',
            rating: 4.7,
            bio: 'Specializes in cognitive therapy for decision-making challenges.',
            state: 'Tamil Nadu',
            onlineSessions: true,
            phone: '+91-9876543221',
            email: 'dr.lakshmi@mindease.com'
          },
          // West Bengal Counselors
          {
            id: 13,
            name: 'Dr. Subhash Banerjee',
            specialty: 'Stress and Anxiety',
            language: 'English, Hindi, Bengali',
            availability: 'Weekdays, Online',
            experience: '15 years',
            rating: 4.9,
            bio: 'Experienced in treating anxiety disorders and stress management.',
            state: 'West Bengal',
            onlineSessions: true,
            phone: '+91-9876543222',
            email: 'dr.subhash@mindease.com'
          },
          {
            id: 14,
            name: 'Dr. Rina Chatterjee',
            specialty: 'Depression',
            language: 'English, Bengali',
            availability: 'Flexible, Online',
            experience: '11 years',
            rating: 4.8,
            bio: 'Specializes in depression treatment and mood stabilization.',
            state: 'West Bengal',
            onlineSessions: true,
            phone: '+91-9876543223',
            email: 'dr.rina@mindease.com'
          }
        ];

        const allCounselors = [...counselorData, ...localCounselors];
        setCounselors(allCounselors);
        setFilteredCounselors(allCounselors.filter(c => selectedStates.includes(c.state)));
      } catch (error) {
        console.error('Error fetching counselors:', error);
        // Use only local data as fallback
        const localCounselors = [
          {
            id: 1,
            name: 'Dr. Sarah Johnson',
            specialty: 'Stress and Anxiety',
            language: 'English, Hindi',
            availability: 'Weekdays, Online',
            experience: '10 years',
            rating: 4.8,
            bio: 'Specialized in cognitive behavioral therapy for stress management.',
            state: 'Delhi',
            onlineSessions: true,
            phone: '+91-9876543210',
            email: 'dr.sarah@mindease.com'
          }
        ];
        setCounselors(localCounselors);
        setFilteredCounselors(localCounselors.filter(c => selectedStates.includes(c.state)));
      }
    };

    fetchCounselors();
  }, [selectedStates]);

  useEffect(() => {
    let filtered = counselors.filter(counselor => {
      const matchesState = selectedStates.includes(counselor.state);
      const matchesSearch = searchTerm === '' ||
        counselor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        counselor.specialty.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSpecialty = filters.specialty === '' || counselor.specialty.toLowerCase().includes(filters.specialty.toLowerCase());
      const matchesLanguage = filters.language === '' || counselor.language.toLowerCase().includes(filters.language.toLowerCase());
      const matchesAvailability = filters.availability === '' || counselor.availability.toLowerCase().includes(filters.availability.toLowerCase());

      return matchesState && matchesSearch && matchesSpecialty && matchesLanguage && matchesAvailability;
    });

    // Prioritize counselors matching the user's issue
    if (userIssue) {
      filtered.sort((a, b) => {
        const aMatch = a.specialty.toLowerCase().includes(userIssue.toLowerCase()) ? 1 : 0;
        const bMatch = b.specialty.toLowerCase().includes(userIssue.toLowerCase()) ? 1 : 0;
        return bMatch - aMatch;
      });
    }

    setFilteredCounselors(filtered);
  }, [counselors, filters, searchTerm, selectedStates, userIssue]);

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({ ...prev, [filterType]: value }));
  };

  const handleBookSession = (counselor, type = 'online') => {
    const message = type === 'online'
      ? `Online session request sent to ${counselor.name}. They will contact you soon via your registered email/phone.`
      : `Appointment request sent to ${counselor.name}. They will contact you to schedule an in-person visit.`;

    alert(message);
    // In a real app, this would integrate with booking systems
  };

  const currentResources = selectedStates.length === 1 ? mentalHealthResources[selectedStates[0]] : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gradient-to-b from-rose-50 via-pink-50 to-fuchsia-50 p-6 relative overflow-hidden"
    >
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-300 to-pink-300 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-blue-300 to-purple-300 rounded-full opacity-20 blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent mb-4 font-poppins">
            Mental Health Support Resources
          </h1>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto leading-relaxed">
            Find qualified professionals and emergency support across all Indian states
          </p>
        </motion.div>

        {/* State Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8 bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-8"
        >
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            🌍 Select Your States
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
            {indianStates.map((state) => (
              <motion.label
                key={state}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`relative cursor-pointer group ${
                  selectedStates.includes(state.toLowerCase())
                    ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg'
                    : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                } rounded-xl p-3 transition-all duration-300 border-2 ${
                  selectedStates.includes(state.toLowerCase())
                    ? 'border-purple-300 shadow-purple-200'
                    : 'border-gray-200 hover:border-purple-200'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedStates.includes(state.toLowerCase())}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedStates([...selectedStates, state.toLowerCase()]);
                    } else {
                      setSelectedStates(selectedStates.filter(s => s !== state.toLowerCase()));
                    }
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="flex items-center justify-center">
                  <span className="text-sm font-semibold text-center">{state}</span>
                </div>
                {selectedStates.includes(state.toLowerCase()) && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center"
                  >
                    <span className="text-white text-xs">✓</span>
                  </motion.div>
                )}
              </motion.label>
            ))}
          </div>
          {selectedStates.length === 0 && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center text-red-500 mt-4 font-medium"
            >
              ⚠️ Please select at least one state to view resources
            </motion.p>
          )}
          {selectedStates.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 text-center"
            >
              <p className="text-sm text-gray-600">
                Selected: <span className="font-semibold text-purple-600">{selectedStates.length} state{selectedStates.length > 1 ? 's' : ''}</span>
              </p>
            </motion.div>
          )}
        </motion.div>

        {/* Emergency Contacts */}
        {selectedStates.length > 0 && currentResources && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-red-50 to-pink-50 border border-red-200 rounded-3xl p-8 mb-8 shadow-xl backdrop-blur-sm"
          >
            <h2 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent mb-6 flex items-center">
              🚨 Emergency Contacts ({selectedStates.length === 1 ? selectedStates[0].charAt(0).toUpperCase() + selectedStates[0].slice(1) : 'Multiple States'})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {currentResources.emergency.map((contact, index) => (
                <motion.div
                  key={index}
                  whileHover={{ scale: 1.02 }}
                  className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-red-100 hover:shadow-xl transition-all duration-300"
                >
                  <div className="flex items-center mb-3">
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
                      <FaPhone className="text-red-600 text-lg" />
                    </div>
                    <h3 className="font-bold text-gray-800 text-lg">{contact.name}</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-4 font-medium">{contact.type}</p>
                  <a
                    href={`tel:${contact.phone}`}
                    className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white font-semibold rounded-xl hover:from-red-600 hover:to-pink-600 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                  >
                    <FaPhone className="mr-2" />
                    Call Now: {contact.phone}
                  </a>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-8 mb-8"
        >
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            🔍 Find Your Perfect Counselor
          </h2>

          <div className="flex flex-col lg:flex-row gap-6 mb-8">
            <div className="flex-1">
              <div className="relative">
                <FaSearch className="absolute left-4 top-4 text-purple-400 text-lg" />
                <input
                  type="text"
                  placeholder="Search by name or specialty..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-6 py-4 text-lg border-2 border-purple-200 rounded-2xl focus:ring-4 focus:ring-purple-300 focus:border-purple-400 transition-all duration-300 bg-white/80 backdrop-blur-sm"
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <select
                value={filters.specialty}
                onChange={(e) => handleFilterChange('specialty', e.target.value)}
                className="px-6 py-4 border-2 border-purple-200 rounded-2xl focus:ring-4 focus:ring-purple-300 focus:border-purple-400 transition-all duration-300 bg-white/80 backdrop-blur-sm text-gray-700 font-medium"
              >
                <option value="">🎯 All Specialties</option>
                <option value="stress">😰 Stress & Anxiety</option>
                <option value="depression">😢 Depression</option>
                <option value="emotional">💔 Emotional Instability</option>
                <option value="confidence">💪 Confidence Issues</option>
                <option value="decision">🤔 Decision-Making</option>
                <option value="sleep">😴 Sleep Issues</option>
                <option value="behavioral">🧠 Behavioral Issues</option>
                <option value="digital">📱 Digital Well-being</option>
              </select>
              <select
                value={filters.language}
                onChange={(e) => handleFilterChange('language', e.target.value)}
                className="px-6 py-4 border-2 border-purple-200 rounded-2xl focus:ring-4 focus:ring-purple-300 focus:border-purple-400 transition-all duration-300 bg-white/80 backdrop-blur-sm text-gray-700 font-medium"
              >
                <option value="">🌐 All Languages</option>
                <option value="english">🇺🇸 English</option>
                <option value="hindi">🇮🇳 Hindi</option>
                <option value="punjabi">🇮🇳 Punjabi</option>
              </select>
              <select
                value={filters.availability}
                onChange={(e) => handleFilterChange('availability', e.target.value)}
                className="px-6 py-4 border-2 border-purple-200 rounded-2xl focus:ring-4 focus:ring-purple-300 focus:border-purple-400 transition-all duration-300 bg-white/80 backdrop-blur-sm text-gray-700 font-medium"
              >
                <option value="">⏰ All Availabilities</option>
                <option value="weekdays">📅 Weekdays</option>
                <option value="evenings">🌆 Evenings</option>
                <option value="weekends">🏖️ Weekends</option>
                <option value="flexible">🔄 Flexible</option>
                <option value="online">💻 Online</option>
              </select>
            </div>
          </div>

          {/* Counselors List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredCounselors.map((counselor, index) => (
              <motion.div
                key={counselor.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5 }}
                className="bg-white/90 backdrop-blur-sm p-8 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 border border-white/20 group"
              >
                <div className="flex items-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-blue-500 rounded-2xl flex items-center justify-center mr-4 shadow-lg">
                    <FaUserMd className="text-white text-xl" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-800 mb-1">{counselor.name}</h3>
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <FaStar
                          key={i}
                          className={`text-sm ${i < Math.floor(counselor.rating) ? 'text-yellow-400' : 'text-gray-300'}`}
                        />
                      ))}
                      <span className="text-sm text-gray-600 ml-2 font-medium">({counselor.rating})</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="font-semibold text-purple-600 mr-2">🎯</span>
                    <span className="font-medium">{counselor.specialty}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="font-semibold text-blue-600 mr-2">⏰</span>
                    <span>{counselor.experience}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="font-semibold text-green-600 mr-2">🌐</span>
                    <span>{counselor.language}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="font-semibold text-orange-600 mr-2">📅</span>
                    <span>{counselor.availability}</span>
                  </div>
                </div>

                <p className="text-sm text-gray-700 mb-6 leading-relaxed italic">"{counselor.bio}"</p>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center text-sm text-gray-600 bg-gray-50 p-3 rounded-xl">
                    <FaPhone className="mr-3 text-green-600 text-lg" />
                    <a href={`tel:${counselor.phone}`} className="hover:text-green-700 font-medium transition-colors">
                      {counselor.phone}
                    </a>
                  </div>
                  <div className="flex items-center text-sm text-gray-600 bg-gray-50 p-3 rounded-xl">
                    <FaEnvelope className="mr-3 text-blue-600 text-lg" />
                    <a href={`mailto:${counselor.email}`} className="hover:text-blue-700 font-medium transition-colors">
                      {counselor.email}
                    </a>
                  </div>
                </div>

                <div className="space-y-3">
                  {counselor.onlineSessions && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleBookSession(counselor, 'online')}
                      className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 px-6 rounded-2xl hover:from-green-600 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center font-semibold"
                    >
                      <FaVideo className="mr-3" />
                      Book Online Session
                    </motion.button>
                  )}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleBookSession(counselor, 'in-person')}
                    className="w-full bg-gradient-to-r from-purple-500 to-blue-600 text-white py-3 px-6 rounded-2xl hover:from-purple-600 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center font-semibold"
                  >
                    <FaCalendarAlt className="mr-3" />
                    Schedule In-Person Visit
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>

          {filteredCounselors.length === 0 && (
            <p className="text-center text-gray-500 mt-6">No counselors match your current filters.</p>
          )}
        </motion.div>

        {/* Hospitals & Clinics */}
        {selectedStates.length > 0 && currentResources && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-2xl shadow-md p-6 mb-8"
          >
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Mental Health Hospitals & Clinics</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {currentResources.hospitals.map((hospital, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">{hospital.name}</h3>
                  <p className="text-sm text-gray-600 mb-2 flex items-start">
                    <FaMapMarkerAlt className="mr-2 mt-0.5 text-red-500" />
                    {hospital.address}
                  </p>
                  <p className="text-sm text-gray-600 mb-2">
                    <strong>Phone:</strong> <a href={`tel:${hospital.phone}`} className="text-indigo-600 hover:text-indigo-700">{hospital.phone}</a>
                  </p>
                  <p className="text-sm text-gray-600 mb-3">
                    <strong>Specialties:</strong> {hospital.specialties.join(', ')}
                  </p>

                  {hospital.doctors && hospital.doctors.length > 0 && (
                    <div className="mb-4">
                      <h4 className="font-medium text-gray-800 mb-2">Available Doctors:</h4>
                      <div className="space-y-2">
                        {hospital.doctors.map((doctor, idx) => (
                          <div key={idx} className="bg-gray-50 p-3 rounded">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium text-gray-800">{doctor.name}</p>
                                <p className="text-sm text-gray-600">{doctor.specialty}</p>
                                <p className="text-sm text-gray-600">{doctor.experience}</p>
                              </div>
                              <div className="flex items-center">
                                <FaStar className="text-yellow-400 mr-1" />
                                <span className="text-sm font-medium">{doctor.rating}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <a
                      href={`tel:${hospital.phone}`}
                      className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-center flex items-center justify-center"
                    >
                      <FaPhone className="mr-2" />
                      Call Now
                    </a>
                    {hospital.onlineBooking && (
                      <button className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center">
                        <FaCalendarAlt className="mr-2" />
                        Book Online
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Helplines */}
        {selectedStates.length > 0 && currentResources && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mb-8"
          >
            <h2 className="text-2xl font-semibold text-blue-700 mb-4">Mental Health Helplines</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentResources.helplines.map((helpline, index) => (
                <div key={index} className="bg-white p-4 rounded-lg shadow-sm">
                  <h3 className="font-semibold text-gray-800">{helpline.name}</h3>
                  <p className="text-sm text-gray-600 mb-2">{helpline.services}</p>
                  <a
                    href={`tel:${helpline.phone}`}
                    className="text-blue-600 font-medium hover:text-blue-700 flex items-center"
                  >
                    <FaPhone className="mr-1" />
                    {helpline.phone}
                  </a>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Online Platforms */}
        {selectedStates.length > 0 && currentResources && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-green-50 border border-green-200 rounded-2xl p-6"
          >
            <h2 className="text-2xl font-semibold text-green-700 mb-4">Online Therapy Platforms</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {currentResources.onlinePlatforms.map((platform, index) => (
                <div key={index} className="bg-white p-4 rounded-lg shadow-sm">
                  <h3 className="font-semibold text-gray-800">{platform.name}</h3>
                  <p className="text-sm text-gray-600 mb-2">{platform.type}</p>
                  <div className="flex items-center mb-2">
                    <FaStar className="text-yellow-400 mr-1" />
                    <span className="text-sm font-medium">{platform.rating}/5</span>
                  </div>
                  <a
                    href={`https://${platform.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-600 font-medium hover:text-green-700"
                  >
                    Visit Website →
                  </a>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-center mt-8"
        >
          <p className="text-sm text-gray-500">
            All information is provided for guidance only. Please consult healthcare professionals for medical advice.
          </p>
          <p className="text-xs text-gray-400 mt-2">
            Made by KeenCoders | Supporting Mental Health in Delhi & Punjab
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Counselors;
