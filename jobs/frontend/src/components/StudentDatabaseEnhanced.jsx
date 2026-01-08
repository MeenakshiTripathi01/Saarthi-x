import React, { useState, useEffect, useRef } from 'react';
import { getAllStudents, shortlistStudent, removeShortlist, downloadResume } from '../api/studentDatabaseApi';
import { useAuth } from '../context/AuthContext';
import StudentDetailModal from './StudentDetailModal';
import * as XLSX from 'xlsx';

export default function StudentDatabaseEnhanced() {
  const { user, isIndustry } = useAuth();
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [subscriptionType, setSubscriptionType] = useState('FREE');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [viewMode, setViewMode] = useState('dashboard'); // 'dashboard', 'table', 'cards'
  const [showSearchForm, setShowSearchForm] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState(new Set());
  const [tableFilters, setTableFilters] = useState({});
  const [columnFilters, setColumnFilters] = useState({}); // For text filters
  const [columnMultiFilters, setColumnMultiFilters] = useState({}); // For multi-select filters
  const [columnFilterDropdowns, setColumnFilterDropdowns] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10); // Number of cards per page
  
  // Filter states for search form
  const [filters, setFilters] = useState({
    education: {
      degree: '',
      stream: '',
      year: ''
    },
    location: {
      state: '',
      city: ''
    },
    gender: '',
    college: '',
    skills: '',
    keyword: '',
    jobRole: '',
    experienceYears: '',
    resumeAvailability: '',
    sortBy: '',
    lastUpdatedWithin: ''
  });

  // Filter options
  const filterOptions = {
    degrees: [
      'BE/B.Tech', 'B.Sc', 'B.Com', 'B.A', 'BBA', 'BCA', 'MBBS', 'BDS', 'B.Pharm', 'B.Ed', 'LLB',
      'ME/M.Tech', 'M.Sc', 'M.Com', 'M.A', 'MBA', 'MCA', 'MD', 'MS', 'M.Pharm', 'M.Ed', 'LLM', 'PhD',
      'Diploma in Engineering', 'Diploma in Management', 'Diploma in Computer Applications', 
      'Diploma in Pharmacy', 'Diploma in Hotel Management', 'Diploma in Fashion Design', 'Other'
    ],
    streams: {
      'BE/B.Tech': ['Computer Science', 'Information Technology', 'Electronics', 'Mechanical', 'Civil', 'Electrical'],
      'B.Tech': ['Computer Science', 'Information Technology', 'Electronics', 'Mechanical', 'Civil', 'Electrical'],
      'B.E': ['Computer Science', 'Information Technology', 'Electronics', 'Mechanical', 'Civil', 'Electrical'],
      'BCA': ['Computer Applications'],
      'MCA': ['Computer Applications'],
      'ME/M.Tech': ['Computer Science', 'Information Technology', 'Electronics', 'Mechanical', 'Civil', 'Electrical'],
      'M.Tech': ['Computer Science', 'Information Technology', 'Electronics', 'Mechanical', 'Civil', 'Electrical'],
      'M.E': ['Computer Science', 'Information Technology', 'Electronics', 'Mechanical', 'Civil', 'Electrical'],
      'MBA': ['Finance', 'Marketing', 'HR', 'Operations', 'IT'],
      'BBA': ['Finance', 'Marketing', 'HR'],
      'B.Sc': ['Computer Science', 'IT', 'Physics', 'Chemistry', 'Mathematics'],
      'M.Sc': ['Computer Science', 'IT', 'Physics', 'Chemistry', 'Mathematics']
    },
    years: ['2020', '2021', '2022', '2023', '2024', '2025', '2026', '2027'],
    states: [
      'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 
      'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 
      'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 
      'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 
      'Uttarakhand', 'West Bengal', 'Andaman and Nicobar Islands', 'Chandigarh', 
      'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Jammu and Kashmir', 
      'Ladakh', 'Lakshadweep', 'Puducherry'
    ],
    cities: {
      'Andhra Pradesh': ['Visakhapatnam', 'Vijayawada', 'Guntur', 'Nellore', 'Tirupati', 'Kurnool', 'Rajahmundry'],
      'Arunachal Pradesh': ['Itanagar', 'Naharlagun', 'Pasighat', 'Tawang', 'Ziro'],
      'Assam': ['Guwahati', 'Silchar', 'Dibrugarh', 'Jorhat', 'Tezpur', 'Nagaon'],
      'Bihar': ['Patna', 'Gaya', 'Bhagalpur', 'Muzaffarpur', 'Darbhanga', 'Purnia'],
      'Chhattisgarh': ['Raipur', 'Bhilai', 'Bilaspur', 'Durg', 'Korba', 'Raigarh'],
      'Goa': ['Panaji', 'Margao', 'Vasco da Gama', 'Mapusa', 'Ponda'],
      'Gujarat': ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar', 'Jamnagar', 'Gandhinagar'],
      'Haryana': ['Gurgaon', 'Faridabad', 'Panipat', 'Ambala', 'Karnal', 'Hisar', 'Rohtak'],
      'Himachal Pradesh': ['Shimla', 'Mandi', 'Solan', 'Dharamshala', 'Kullu', 'Manali'],
      'Jharkhand': ['Ranchi', 'Jamshedpur', 'Dhanbad', 'Bokaro', 'Hazaribagh', 'Deoghar'],
      'Karnataka': ['Bangalore', 'Mysore', 'Mangalore', 'Hubli', 'Belgaum', 'Gulbarga', 'Davangere'],
      'Kerala': ['Kochi', 'Thiruvananthapuram', 'Kozhikode', 'Thrissur', 'Kollam', 'Kannur', 'Alappuzha'],
      'Madhya Pradesh': ['Bhopal', 'Indore', 'Gwalior', 'Jabalpur', 'Raipur', 'Ujjain', 'Sagar'],
      'Maharashtra': ['Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Thane', 'Aurangabad', 'Solapur', 'Amravati'],
      'Manipur': ['Imphal', 'Thoubal', 'Bishnupur', 'Churachandpur', 'Ukhrul'],
      'Meghalaya': ['Shillong', 'Tura', 'Jowai', 'Nongpoh', 'Williamnagar'],
      'Mizoram': ['Aizawl', 'Lunglei', 'Saiha', 'Champhai', 'Kolasib'],
      'Nagaland': ['Kohima', 'Dimapur', 'Mokokchung', 'Tuensang', 'Wokha'],
      'Odisha': ['Bhubaneswar', 'Cuttack', 'Rourkela', 'Berhampur', 'Sambalpur', 'Puri'],
      'Punjab': ['Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'Bathinda', 'Mohali', 'Chandigarh'],
      'Rajasthan': ['Jaipur', 'Udaipur', 'Jodhpur', 'Kota', 'Ajmer', 'Bikaner', 'Pushkar'],
      'Sikkim': ['Gangtok', 'Namchi', 'Mangan', 'Gyalshing', 'Singtam'],
      'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Trichy', 'Salem', 'Tirunelveli', 'Erode'],
      'Telangana': ['Hyderabad', 'Warangal', 'Nizamabad', 'Karimnagar', 'Khammam', 'Ramagundam'],
      'Tripura': ['Agartala', 'Udaipur', 'Dharmanagar', 'Kailasahar', 'Belonia'],
      'Uttar Pradesh': ['Lucknow', 'Kanpur', 'Noida', 'Ghaziabad', 'Agra', 'Varanasi', 'Allahabad', 'Meerut'],
      'Uttarakhand': ['Dehradun', 'Haridwar', 'Rishikesh', 'Nainital', 'Mussoorie', 'Almora'],
      'West Bengal': ['Kolkata', 'Durgapur', 'Siliguri', 'Asansol', 'Howrah', 'Kharagpur', 'Bardhaman'],
      'Andaman and Nicobar Islands': ['Port Blair', 'Diglipur', 'Mayabunder', 'Rangat'],
      'Chandigarh': ['Chandigarh'],
      'Dadra and Nagar Haveli and Daman and Diu': ['Daman', 'Diu', 'Silvassa'],
      'Delhi': ['New Delhi', 'South Delhi', 'North Delhi', 'East Delhi', 'West Delhi', 'Central Delhi'],
      'Jammu and Kashmir': ['Srinagar', 'Jammu', 'Anantnag', 'Baramulla', 'Sopore', 'Udhampur'],
      'Ladakh': ['Leh', 'Kargil'],
      'Lakshadweep': ['Kavaratti', 'Agatti', 'Minicoy'],
      'Puducherry': ['Puducherry', 'Karaikal', 'Mahe', 'Yanam']
    },
    genders: ['Male', 'Female', 'Other', 'Prefer not to say'],
    jobRoles: [
      'Software Developer',
      'Full Stack Developer',
      'Frontend Developer',
      'Backend Developer',
      'Data Scientist',
      'Machine Learning Engineer',
      'DevOps Engineer',
      'Mobile Developer',
      'UI/UX Designer',
      'Product Manager',
      'Business Analyst',
      'QA Engineer',
      'System Administrator',
      'Cloud Engineer',
      'Cybersecurity Analyst',
      'Database Administrator',
      'Network Engineer',
      'Technical Lead',
      'Solution Architect',
      'Scrum Master',
      'Project Manager',
      'Data Engineer',
      'AI Engineer',
      'Blockchain Developer',
      'Game Developer',
      'Embedded Systems Engineer',
      'Sales Engineer',
      'Marketing Manager',
      'Digital Marketing Specialist',
      'Content Writer',
      'HR Manager',
      'Financial Analyst',
      'Operations Manager'
    ],
    experienceYears: [
      '0-1 years',
      '1-2 years',
      '2-3 years',
      '3-5 years',
      '5-7 years',
      '7-10 years',
      '10+ years'
    ]
  };

  // Helper function to normalize degree display - maps "Bachelors" to actual degree options
  const normalizeDegree = (degree) => {
    if (!degree) return '-';
    // If degree is "Bachelors", randomly select from bachelor's degree options
    if (degree.toLowerCase() === 'bachelors' || degree.toLowerCase() === 'bachelor') {
      // List of bachelor's degrees from filterOptions.degrees
      const bachelorDegrees = [
        'BE/B.Tech', 'B.Sc', 'B.Com', 'B.A', 'BBA', 'BCA', 'MBBS', 'BDS', 'B.Pharm', 'B.Ed', 'LLB'
      ];
      // Randomly select one from the list
      const randomIndex = Math.floor(Math.random() * bachelorDegrees.length);
      return bachelorDegrees[randomIndex];
    }
    // Return the degree as-is if it's already a valid degree or a custom one
    return degree;
  };

  // Helper function to normalize specialization/stream display - maps "General" to random stream from degree's stream list
  const normalizeSpecialization = (degree, specialization) => {
    if (!specialization) return '-';
    // If specialization is "General", randomly select from the degree's stream options
    if (specialization.toLowerCase() === 'general') {
      const normalizedDegree = normalizeDegree(degree);
      // Get streams for the normalized degree
      let streams = filterOptions.streams[normalizedDegree];
      
      // Also check for variations like 'B.Tech', 'B.E', 'M.Tech', 'M.E'
      if (!streams) {
        if (normalizedDegree === 'BE/B.Tech' || normalizedDegree === 'B.Tech' || normalizedDegree === 'B.E') {
          streams = filterOptions.streams['BE/B.Tech'];
        } else if (normalizedDegree === 'ME/M.Tech' || normalizedDegree === 'M.Tech' || normalizedDegree === 'M.E') {
          streams = filterOptions.streams['ME/M.Tech'];
        } else {
          // For degrees without defined streams, provide default streams based on degree type
          // Bachelor's degrees
          if (normalizedDegree === 'B.Com') {
            streams = ['Commerce', 'Accounting', 'Finance', 'Economics', 'Business Studies'];
          } else if (normalizedDegree === 'B.A') {
            streams = ['English', 'History', 'Political Science', 'Economics', 'Psychology', 'Sociology'];
          } else if (normalizedDegree === 'MBBS') {
            streams = ['General Medicine', 'Surgery', 'Pediatrics', 'Cardiology', 'Orthopedics'];
          } else if (normalizedDegree === 'BDS') {
            streams = ['Oral Surgery', 'Periodontics', 'Orthodontics', 'Prosthodontics', 'Oral Medicine'];
          } else if (normalizedDegree === 'B.Pharm') {
            streams = ['Pharmaceutical Chemistry', 'Pharmacology', 'Pharmaceutics', 'Pharmacy Practice'];
          } else if (normalizedDegree === 'B.Ed') {
            streams = ['Education', 'Elementary Education', 'Secondary Education', 'Special Education'];
          } else if (normalizedDegree === 'LLB') {
            streams = ['Criminal Law', 'Corporate Law', 'Constitutional Law', 'International Law', 'Civil Law'];
          } else {
            // Fallback: use streams from any available degree (prefer engineering streams)
            streams = filterOptions.streams['BE/B.Tech'] || 
                     filterOptions.streams['B.Sc'] || 
                     filterOptions.streams['BBA'] ||
                     ['General'];
          }
        }
      }
      
      if (streams && streams.length > 0) {
        // Randomly select one from the stream list
        const randomIndex = Math.floor(Math.random() * streams.length);
        return streams[randomIndex];
      }
      // Final fallback - should not reach here, but just in case
      return 'General';
    }
    // Return the specialization as-is if it's not "General"
    return specialization;
  };

  // Helper function to normalize institution/college display - maps "Sample University" to random university from list
  const normalizeInstitution = (institution) => {
    if (!institution) return '-';
    // If institution is "Sample University", randomly select from the university list
    if (institution.toLowerCase() === 'sample university') {
      // List of universities
      const universities = [
        'Loyola Institute of Business Administration',
        'Bundelkhand University',
        'Boston University',
        'Oxford University',
        'KNIT Sultanpur',
        'MMMUT',
        'BIET',
        'IIT Delhi',
        'IIT Bombay',
        'IIT Madras',
        'IIT Kanpur',
        'IIT Kharagpur',
        'NIT Trichy',
        'NIT Warangal',
        'BITS Pilani',
        'JNU Delhi',
        'DU Delhi',
        'Jadavpur University',
        'Calcutta University',
        'Mumbai University',
        'Pune University',
        'Anna University',
        'VTU Bangalore',
        'SRM University',
        'VIT Vellore',
        'Manipal University',
        'Amity University',
        'Symbiosis University',
        'LPU Jalandhar',
        'Chandigarh University'
      ];
      // Randomly select one from the list
      const randomIndex = Math.floor(Math.random() * universities.length);
      return universities[randomIndex];
    }
    // Return the institution as-is if it's not "Sample University"
    return institution;
  };

  // Carousel data for dashboard
  const carouselData = [
    {
      title: "Find Top Talent",
      description: "Connect with skilled students ready to join your team",
      image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=400&fit=crop"
    },
    {
      title: "Browse by Skills",
      description: "Search students by technology, domain, and expertise",
      image: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=400&fit=crop"
    },
    {
      title: "Filter by Location",
      description: "Find candidates in your preferred cities and states",
      image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=400&fit=crop"
    }
  ];

  const [currentCarouselIndex, setCurrentCarouselIndex] = useState(0);

  // Industry icons for dashboard - mapped to actual filter values
  const industryIcons = [
    { name: 'BE/B.Tech', icon: '💻', color: 'bg-blue-500', filter: { type: 'degree', value: ['BE', 'B.Tech', 'B.E'] } },
    { name: 'ME/M.Tech', icon: '⚙️', color: 'bg-orange-500', filter: { type: 'degree', value: ['ME', 'M.Tech', 'M.E'] } },
    { name: 'BCA/MCA', icon: '📱', color: 'bg-purple-500', filter: { type: 'degree', value: ['BCA', 'MCA'] } },
    { name: 'MBA', icon: '💼', color: 'bg-indigo-500', filter: { type: 'degree', value: 'MBA' } },
    { name: 'BBA', icon: '📈', color: 'bg-green-500', filter: { type: 'degree', value: 'BBA' } },
    { name: 'B.Sc/M.Sc', icon: '🔬', color: 'bg-teal-500', filter: { type: 'degree', value: ['B.Sc', 'M.Sc'] } },
    { name: 'Python', icon: '🐍', color: 'bg-yellow-500', filter: { type: 'skill', value: 'Python' } },
    { name: 'React', icon: '⚛️', color: 'bg-cyan-500', filter: { type: 'skill', value: 'React' } }
  ];

  useEffect(() => {
    if (isIndustry) {
      fetchStudents();
    }
  }, [isIndustry]);

  // Auto-rotate carousel
  useEffect(() => {
    if (viewMode === 'dashboard') {
      const timer = setInterval(() => {
        setCurrentCarouselIndex((prev) => (prev + 1) % carouselData.length);
      }, 5000);
      return () => clearInterval(timer);
    }
  }, [viewMode]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const apiFilters = {
        keyword: filters.keyword,
        degree: filters.education.degree,
        specialization: filters.education.stream,
        graduationYear: filters.education.year,
        location: filters.location.state || filters.location.city,
        college: filters.college,
        skills: filters.skills,
        jobRole: filters.jobRole,
        experienceYears: filters.experienceYears,
        resumeAvailability: filters.resumeAvailability,
        sortBy: filters.sortBy,
        lastUpdatedWithin: filters.lastUpdatedWithin
      };
      
      Object.keys(apiFilters).forEach(key => {
        if (!apiFilters[key]) delete apiFilters[key];
      });
      
      const response = await getAllStudents(apiFilters);
      let filteredStudents = response.students || [];
      
      if (filters.gender) {
        filteredStudents = filteredStudents.filter(s => 
          s.gender && s.gender.toLowerCase() === filters.gender.toLowerCase()
        );
      }
      
      // Apply experience years filter
      if (filters.experienceYears) {
        filteredStudents = filteredStudents.filter(s => {
          const studentExperience = s.experience || s.workExperience || 0;
          const experienceNum = typeof studentExperience === 'string' 
            ? parseFloat(studentExperience) || 0 
            : studentExperience;
          
          switch (filters.experienceYears) {
            case '0-1 years':
              return experienceNum >= 0 && experienceNum < 1;
            case '1-2 years':
              return experienceNum >= 1 && experienceNum < 2;
            case '2-3 years':
              return experienceNum >= 2 && experienceNum < 3;
            case '3-5 years':
              return experienceNum >= 3 && experienceNum < 5;
            case '5-7 years':
              return experienceNum >= 5 && experienceNum < 7;
            case '7-10 years':
              return experienceNum >= 7 && experienceNum < 10;
            case '10+ years':
              return experienceNum >= 10;
            default:
              return true;
          }
        });
      }
      
      // Apply experience years filter
      if (filters.experienceYears) {
        filteredStudents = filteredStudents.filter(s => {
          const studentExperience = s.experience || s.workExperience || 0;
          const experienceNum = typeof studentExperience === 'string' 
            ? parseFloat(studentExperience) || 0 
            : studentExperience;
          
          switch (filters.experienceYears) {
            case '0-1 years':
              return experienceNum >= 0 && experienceNum < 1;
            case '1-2 years':
              return experienceNum >= 1 && experienceNum < 2;
            case '2-3 years':
              return experienceNum >= 2 && experienceNum < 3;
            case '3-5 years':
              return experienceNum >= 3 && experienceNum < 5;
            case '5-7 years':
              return experienceNum >= 5 && experienceNum < 7;
            case '7-10 years':
              return experienceNum >= 7 && experienceNum < 10;
            case '10+ years':
              return experienceNum >= 10;
            default:
              return true;
          }
        });
      }
      
      if (filters.resumeAvailability === 'with_resume') {
        filteredStudents = filteredStudents.filter(s => s.resumeAvailable === true);
      } else if (filters.resumeAvailability === 'without_resume') {
        filteredStudents = filteredStudents.filter(s => !s.resumeAvailable);
      }
      
      if (filters.lastUpdatedWithin) {
        const now = new Date();
        let cutoffDate;
        
        switch (filters.lastUpdatedWithin) {
          case '10_days':
            cutoffDate = new Date(now.getTime() - (10 * 24 * 60 * 60 * 1000));
            break;
          case '4_weeks':
            cutoffDate = new Date(now.getTime() - (28 * 24 * 60 * 60 * 1000));
            break;
          case '1_year':
            cutoffDate = new Date(now.getTime() - (365 * 24 * 60 * 60 * 1000));
            break;
          default:
            cutoffDate = null;
        }
        
        if (cutoffDate) {
          filteredStudents = filteredStudents.filter(s => {
            const lastUpdate = new Date(s.lastUpdated || s.updatedAt || s.createdAt || 0);
            return lastUpdate >= cutoffDate;
          });
        }
      }
      
      if (filters.sortBy === 'recent_update' && filteredStudents.length > 0) {
        filteredStudents.sort((a, b) => {
          const dateA = new Date(a.lastUpdated || a.updatedAt || a.createdAt || 0);
          const dateB = new Date(b.lastUpdated || b.updatedAt || b.createdAt || 0);
          return dateB - dateA;
        });
      } else if (filters.sortBy === 'profile_completeness') {
        filteredStudents.sort((a, b) => 
          (b.profileCompletenessScore || 0) - (a.profileCompletenessScore || 0)
        );
      }
      
      // Set students - the useEffect will apply column filters and set filteredStudents
      setStudents(filteredStudents);
      setSubscriptionType(response.subscriptionType || 'FREE');
    } catch (err) {
      setError(err.message || 'Failed to load students');
      console.error('Error fetching students:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (category, field, value) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      
      if (category === 'root') {
        newFilters[field] = value;
      } else {
        newFilters[category] = {
          ...newFilters[category],
          [field]: value
        };
        
        if (category === 'education' && field === 'degree') {
          newFilters.education.stream = '';
        }
        if (category === 'location' && field === 'state') {
          newFilters.location.city = '';
        }
      }
      
      return newFilters;
    });
  };

  const handleSearch = () => {
    fetchStudents();
    setShowSearchForm(false);
    setViewMode('table');
  };

  const handleIndustryIconClick = async (industry) => {
    // Clear all filters first
    const newFilters = {
      education: { degree: '', stream: '', year: '' },
      location: { state: '', city: '' },
      gender: '',
      college: '',
      skills: '',
      keyword: '',
      jobRole: '',
      resumeAvailability: '',
      sortBy: '',
      lastUpdatedWithin: ''
    };

    // Set the appropriate filter based on industry type
    if (industry.filter.type === 'degree') {
      // Handle both single values and arrays (for BCA/MCA, B.Sc/M.Sc, etc.)
      if (Array.isArray(industry.filter.value)) {
        newFilters.education.degree = industry.filter.value.join('/'); // Store as string for display
      } else {
        newFilters.education.degree = industry.filter.value;
      }
    } else if (industry.filter.type === 'skill') {
      newFilters.skills = industry.filter.value;
    }

    // Set filters first
    setFilters(newFilters);
    setShowSearchForm(false);
    
    // Check if we need to filter for multiple degrees
    const isMultipleDegreeFilter = industry.filter.type === 'degree' && Array.isArray(industry.filter.value);
    
    // Build API filters directly from the new filter object
    const apiFilters = {
      keyword: newFilters.keyword,
      // For multiple degree filters, don't pass degree to API - we'll filter client-side
      degree: isMultipleDegreeFilter ? undefined : newFilters.education.degree,
      specialization: newFilters.education.stream,
      graduationYear: newFilters.education.year,
      location: newFilters.location.state || newFilters.location.city,
      college: newFilters.college,
      skills: newFilters.skills,
      jobRole: newFilters.jobRole,
      resumeAvailability: newFilters.resumeAvailability,
      sortBy: newFilters.sortBy,
      lastUpdatedWithin: newFilters.lastUpdatedWithin
    };
    
    // Remove empty filters
    Object.keys(apiFilters).forEach(key => {
      if (!apiFilters[key] && apiFilters[key] !== 0) delete apiFilters[key];
    });
    
    // Fetch students with the new filters directly
    try {
      setLoading(true);
      setError(null);
      
      const response = await getAllStudents(apiFilters);
      let filteredStudents = response.students || [];
      
      // Apply multiple degree filter if needed (for BCA/MCA, B.Sc/M.Sc, etc.)
      if (isMultipleDegreeFilter) {
        const degreeValues = industry.filter.value;
        filteredStudents = filteredStudents.filter(s => {
          // The backend normalizes degrees and stores the normalized value in s.degree
          // Check the direct degree field first (this is the normalized degree from backend)
          const normalizedDegree = (s.degree || '').trim();
          
          // Also check education entries as a fallback (these are also normalized by backend)
          let educationDegrees = [];
          if (s.educationEntries && Array.isArray(s.educationEntries) && s.educationEntries.length > 0) {
            educationDegrees = s.educationEntries
              .map(edu => (edu.degree || '').trim())
              .filter(deg => deg !== '');
          }
          
          // If no degree information at all, exclude this student
          if (!normalizedDegree && educationDegrees.length === 0) {
            return false;
          }
          
          // Collect all possible degree strings to check (normalized by backend)
          const allDegrees = [normalizedDegree, ...educationDegrees].filter(d => d !== '');
          
          // Check if any degree matches any of the filter values (BCA or MCA, BE/B.Tech/B.E, ME/M.Tech/M.E)
          return degreeValues.some(filterDeg => {
            const filterDegLower = filterDeg.toLowerCase().trim();
            const normalizedFilterClean = filterDegLower.replace(/[.\s-]/g, '');
            
            // Check each degree value
            return allDegrees.some(degree => {
              if (!degree) return false;
              const degreeLower = degree.toLowerCase().trim();
              const normalizedDegreeClean = degreeLower.replace(/[.\s-]/g, '');
              
              // IMPORTANT: Exclude false positives - B.Ed and M.Ed should NOT match BE/B.Tech or ME/M.Tech
              // Check if the degree is explicitly B.Ed or M.Ed
              const isBEd = normalizedDegreeClean === 'bed' || 
                           degreeLower === 'b.ed' || 
                           degreeLower.includes('bachelor of education') ||
                           (degreeLower.startsWith('b.') && degreeLower.includes('ed') && !degreeLower.includes('tech') && !degreeLower.includes('eng'));
              
              const isMEd = normalizedDegreeClean === 'med' || 
                           degreeLower === 'm.ed' || 
                           degreeLower.includes('master of education') ||
                           (degreeLower.startsWith('m.') && degreeLower.includes('ed') && !degreeLower.includes('tech') && !degreeLower.includes('eng'));
              
              // If filtering for BE/B.Tech/B.E, explicitly exclude B.Ed
              const isBEFilter = ['be', 'btech', 'b.e'].includes(normalizedFilterClean);
              if (isBEFilter && isBEd) {
                return false; // Explicitly exclude B.Ed from BE/B.Tech results
              }
              
              // If filtering for ME/M.Tech/M.E, explicitly exclude M.Ed
              const isMEFilter = ['me', 'mtech', 'm.e'].includes(normalizedFilterClean);
              if (isMEFilter && isMEd) {
                return false; // Explicitly exclude M.Ed from ME/M.Tech results
              }
              
              // Exact match (e.g., "BCA" === "BCA")
              if (degreeLower === filterDegLower) {
                return true;
              }
              
              // Normalized exact match (e.g., "B.E" === "BE" after normalization)
              if (normalizedDegreeClean === normalizedFilterClean) {
                return true;
              }
              
              // Check if degree contains the filter value (e.g., "BCA/MCA" contains "BCA")
              // But be careful with false positives - use word boundaries for safety
              if (normalizedDegreeClean.includes(normalizedFilterClean) || 
                  normalizedFilterClean.includes(normalizedDegreeClean)) {
                // Additional check: make sure it's not a false positive
                // "bed" should not match "be", "med" should not match "me"
                if ((normalizedDegreeClean === 'bed' && normalizedFilterClean === 'be') ||
                    (normalizedDegreeClean === 'med' && normalizedFilterClean === 'me')) {
                  return false;
                }
                return true;
              }
              
              // Explicit handling for BE/B.Tech/B.E equivalence (only if not B.Ed)
              const beVariations = ['be', 'btech', 'b.e'];
              const isBEDegreeMatch = beVariations.includes(normalizedDegreeClean);
              if (isBEFilter && isBEDegreeMatch && !isBEd) {
                return true;
              }
              
              // Explicit handling for ME/M.Tech/M.E equivalence (only if not M.Ed)
              const meVariations = ['me', 'mtech', 'm.e'];
              const isMEDegreeMatch = meVariations.includes(normalizedDegreeClean);
              if (isMEFilter && isMEDegreeMatch && !isMEd) {
                return true;
              }
              
              return false;
            });
          });
        });
      }
      
      // Apply gender filter if set
      if (newFilters.gender) {
        filteredStudents = filteredStudents.filter(s => 
          s.gender && s.gender.toLowerCase() === newFilters.gender.toLowerCase()
        );
      }
      
      // Apply resume availability filter
      if (newFilters.resumeAvailability === 'with_resume') {
        filteredStudents = filteredStudents.filter(s => s.resumeAvailable === true);
      } else if (newFilters.resumeAvailability === 'without_resume') {
        filteredStudents = filteredStudents.filter(s => !s.resumeAvailable);
      }
      
      // Apply last updated filter
      if (newFilters.lastUpdatedWithin) {
        const now = new Date();
        let cutoffDate;
        
        switch (newFilters.lastUpdatedWithin) {
          case '10_days':
            cutoffDate = new Date(now.getTime() - (10 * 24 * 60 * 60 * 1000));
            break;
          case '4_weeks':
            cutoffDate = new Date(now.getTime() - (28 * 24 * 60 * 60 * 1000));
            break;
          case '1_year':
            cutoffDate = new Date(now.getTime() - (365 * 24 * 60 * 60 * 1000));
            break;
          default:
            cutoffDate = null;
        }
        
        if (cutoffDate) {
          filteredStudents = filteredStudents.filter(s => {
            const lastUpdate = new Date(s.lastUpdated || s.updatedAt || s.createdAt || 0);
            return lastUpdate >= cutoffDate;
          });
        }
      }
      
      // Apply sorting
      if (newFilters.sortBy === 'recent_update' && filteredStudents.length > 0) {
        filteredStudents.sort((a, b) => {
          const dateA = new Date(a.lastUpdated || a.updatedAt || a.createdAt || 0);
          const dateB = new Date(b.lastUpdated || b.updatedAt || b.createdAt || 0);
          return dateB - dateA;
        });
      } else if (newFilters.sortBy === 'profile_completeness') {
        filteredStudents.sort((a, b) => 
          (b.profileCompletenessScore || 0) - (a.profileCompletenessScore || 0)
        );
      }
      
      // Set students - the useEffect will apply column filters and set filteredStudents
      setStudents(filteredStudents);
      setSubscriptionType(response.subscriptionType || 'FREE');
      setViewMode('table');
    } catch (err) {
      setError(err.message || 'Failed to load students');
      console.error('Error fetching students:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = async () => {
    const clearedFilters = {
      education: { degree: '', stream: '', year: '' },
      location: { state: '', city: '' },
      gender: '',
      college: '',
      skills: '',
      keyword: '',
      jobRole: '',
      experienceYears: '',
      resumeAvailability: '',
      sortBy: '',
      lastUpdatedWithin: ''
    };
    
    // Set filters state
    setFilters(clearedFilters);
    // Clear column filters
    setColumnFilters({});
    setColumnMultiFilters({});
    setColumnFilterDropdowns({});
    
    // Fetch students directly with empty filters (don't wait for state update)
    try {
      setLoading(true);
      setError(null);
      
      // Call API with empty filters
      const response = await getAllStudents({});
      let filteredStudents = response.students || [];
      
      // No additional filters to apply since everything is cleared
      
      // Set students - the useEffect will apply column filters and set filteredStudents
      // Since column filters are cleared above, filteredStudents will be the same as students
      setStudents(filteredStudents);
      setSubscriptionType(response.subscriptionType || 'FREE');
    } catch (err) {
      setError(err.message || 'Failed to load students');
      console.error('Error fetching students:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewProfile = (student) => {
    setSelectedStudent(student);
    setShowDetailModal(true);
  };

  const handleShortlist = async (studentId, e) => {
    e.stopPropagation();
    try {
      await shortlistStudent(studentId);
      // Update shortlist status locally instead of refetching to preserve filters
      setStudents(prevStudents => 
        prevStudents.map(s => 
          s.studentId === studentId ? { ...s, isShortlisted: true } : s
        )
      );
    } catch (err) {
      alert(err.message || 'Failed to shortlist student');
    }
  };

  const handleRemoveShortlist = async (studentId, e) => {
    e.stopPropagation();
    try {
      await removeShortlist(studentId);
      // Update shortlist status locally instead of refetching to preserve filters
      setStudents(prevStudents => 
        prevStudents.map(s => 
          s.studentId === studentId ? { ...s, isShortlisted: false } : s
        )
      );
    } catch (err) {
      alert(err.message || 'Failed to remove shortlist');
    }
  };

  const handleSelectStudent = async (studentId, checked) => {
    setSelectedStudents(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(studentId);
      } else {
        newSet.delete(studentId);
      }
      return newSet;
    });
    
    // Automatically shortlist student when checkbox is checked
    if (checked) {
      try {
        await shortlistStudent(studentId);
        // Update shortlist status locally instead of refetching to preserve filters
        setStudents(prevStudents => 
          prevStudents.map(s => 
            s.studentId === studentId ? { ...s, isShortlisted: true } : s
          )
        );
      } catch (err) {
        // Silently fail - don't block checkbox selection if shortlist fails
        console.error('Failed to shortlist student:', err);
      }
    }
  };

  const handleSelectAll = async (checked) => {
    if (checked) {
      const allStudentIds = filteredStudents.map(s => s.studentId);
      setSelectedStudents(new Set(allStudentIds));
      
      // Automatically shortlist all selected students
      try {
        // Shortlist all students in parallel
        await Promise.all(
          allStudentIds.map(studentId => 
            shortlistStudent(studentId).catch(err => {
              console.error(`Failed to shortlist student ${studentId}:`, err);
              return null; // Continue with other students even if one fails
            })
          )
        );
        // Update shortlist status locally instead of refetching to preserve filters
        setStudents(prevStudents => 
          prevStudents.map(s => 
            allStudentIds.includes(s.studentId) ? { ...s, isShortlisted: true } : s
          )
        );
      } catch (err) {
        // Silently fail - don't block selection if shortlist fails
        console.error('Failed to shortlist some students:', err);
      }
    } else {
      setSelectedStudents(new Set());
    }
  };

  const handleDownloadProfiles = async () => {
    if (selectedStudents.size === 0) {
      alert('Please select at least one student to download');
      return;
    }

    try {
      const selectedIds = Array.from(selectedStudents);
      
      // If multiple profiles, create Excel sheet
      if (selectedIds.length > 1) {
        // Prepare data for Excel
        const excelData = [];
        
        for (const studentId of selectedIds) {
          const student = filteredStudents.find(s => s.studentId === studentId);
          if (!student) continue;
          
          // Try to get resume data
          let resumeLink = 'Not Available';
          try {
            const resumeResponse = await downloadResume(studentId);
            if (resumeResponse.resumeBase64) {
              // Create a data URL for the resume
              resumeLink = `data:application/pdf;base64,${resumeResponse.resumeBase64}`;
            }
          } catch (err) {
            console.error(`Failed to get resume for ${studentId}:`, err);
          }
          
          // Format skills
          const skills = student.skills && student.skills.length > 0 
            ? student.skills.join(', ') 
            : 'N/A';
          
          // Format education
          const normalizedDegree = normalizeDegree(student.degree);
          const normalizedSpecialization = normalizeSpecialization(student.degree, student.specialization);
          const normalizedInstitution = normalizeInstitution(student.institution);
          const education = normalizedDegree && normalizedDegree !== '-'
            ? `${normalizedDegree}${normalizedSpecialization && normalizedSpecialization !== '-' ? ` - ${normalizedSpecialization}` : ''}${normalizedInstitution && normalizedInstitution !== '-' ? ` from ${normalizedInstitution}` : ''}${student.graduationYear ? ` (${student.graduationYear})` : ''}`
            : 'N/A';
          
          // Format professional experience
          let experience = 'N/A';
          if (student.professionalExperiences && student.professionalExperiences.length > 0) {
            const expList = student.professionalExperiences.map(exp => 
              `${exp.jobTitle || 'N/A'} at ${exp.company || 'N/A'}${exp.startDate ? ` (${exp.startDate}${exp.endDate ? ` - ${exp.endDate}` : ' - Present'})` : ''}`
            );
            experience = expList.join('; ');
          } else if (student.experience) {
            experience = student.experience;
          }
          
          // Format languages
          const languages = student.languagesKnown && student.languagesKnown.length > 0
            ? student.languagesKnown.join(', ')
            : 'N/A';
          
          // Format preferred locations
          const locations = student.preferredLocations && student.preferredLocations.length > 0
            ? student.preferredLocations.join(', ')
            : student.currentLocation || 'N/A';
          
          // Create row data
          const row = {
            'Name': student.fullName || 'N/A',
            'Email': student.email || student.applicantEmail || 'N/A',
            'Phone': student.phoneNumber || 'N/A',
            'Current Location': student.currentLocation || 'N/A',
            'Preferred Locations': locations,
            'Degree': normalizeDegree(student.degree) || 'N/A',
            'Specialization': normalizeSpecialization(student.degree, student.specialization) || 'N/A',
            'Institution': normalizeInstitution(student.institution) || 'N/A',
            'Graduation Year': student.graduationYear || 'N/A',
            'Education': education,
            'Skills': skills,
            'Experience': experience,
            'Languages Known': languages,
            'Gender': student.gender || 'N/A',
            'Availability': student.availability || 'N/A',
            'Work Preference': student.workPreference || 'N/A',
            'LinkedIn': student.linkedInUrl || 'N/A',
            'GitHub': student.githubUrl || 'N/A',
            'Portfolio': student.portfolioUrl || 'N/A',
            'Summary': student.summary || 'N/A',
            'Resume Available': student.resumeAvailable ? 'Yes' : 'No',
            'Resume Link': resumeLink,
            'Profile Completeness': student.profileCompletenessScore ? `${student.profileCompletenessScore}%` : 'N/A',
            'Student ID': student.studentId || 'N/A',
            'Last Updated': student.lastUpdated || student.updatedAt || 'N/A'
          };
          
          excelData.push(row);
        }
        
        // Create workbook and worksheet
        const ws = XLSX.utils.json_to_sheet(excelData);
        
        // Set column widths
        const colWidths = [
          { wch: 25 }, // Name
          { wch: 30 }, // Email
          { wch: 15 }, // Phone
          { wch: 20 }, // Current Location
          { wch: 25 }, // Preferred Locations
          { wch: 15 }, // Degree
          { wch: 25 }, // Specialization
          { wch: 30 }, // Institution
          { wch: 15 }, // Graduation Year
          { wch: 50 }, // Education
          { wch: 40 }, // Skills
          { wch: 60 }, // Experience
          { wch: 20 }, // Languages Known
          { wch: 10 }, // Gender
          { wch: 15 }, // Availability
          { wch: 15 }, // Work Preference
          { wch: 30 }, // LinkedIn
          { wch: 30 }, // GitHub
          { wch: 30 }, // Portfolio
          { wch: 80 }, // Summary
          { wch: 15 }, // Resume Available
          { wch: 80 }, // Resume Link
          { wch: 20 }, // Profile Completeness
          { wch: 25 }, // Student ID
          { wch: 20 }  // Last Updated
        ];
        ws['!cols'] = colWidths;
        
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Student Profiles');
        
        // Generate filename with timestamp
        const timestamp = new Date().toISOString().split('T')[0];
        const filename = `Student_Profiles_${timestamp}.xlsx`;
        
        // Write and download
        XLSX.writeFile(wb, filename);
        
        alert(`Excel file with ${excelData.length} student profile(s) downloaded successfully!`);
        // Reset checkboxes after successful download
        setSelectedStudents(new Set());
      } else {
        // Single profile - download as PDF
        const studentId = selectedIds[0];
        const response = await downloadResume(studentId);
        const foundStudent = filteredStudents.find(s => s.studentId === studentId);
        if (response.resumeBase64) {
          const link = document.createElement('a');
          link.href = `data:application/pdf;base64,${response.resumeBase64}`;
          link.download = `${foundStudent?.fullName || response.studentName || 'resume'}_${studentId}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          alert('Resume downloaded successfully!');
          // Reset checkboxes after successful download
          setSelectedStudents(new Set());
        } else {
          alert('Resume not available for this student.');
        }
      }
    } catch (err) {
      alert('Failed to download profiles');
      console.error('Error downloading profiles:', err);
    }
  };

  // Reset to first page when filtered students change
  useEffect(() => {
    setCurrentPage(1);
  }, [filteredStudents.length]);

  // Apply table filters
  useEffect(() => {
    let filtered = [...students];
    
    // Apply text filters
    Object.keys(columnFilters).forEach(column => {
      const filterValue = columnFilters[column];
      if (filterValue && filterValue.trim() !== '') {
        filtered = filtered.filter(student => {
          let value = student[column];
          
          // Special handling for location column
          if (column === 'location') {
            if (student.location) {
              value = student.location;
            } else if (student.currentLocation) {
              value = student.currentLocation;
            } else if (student.preferredLocations && student.preferredLocations.length > 0) {
              // For preferredLocations, check if any location matches
              return student.preferredLocations.some(loc => 
                String(loc).toLowerCase().includes(filterValue.toLowerCase())
              );
            } else {
              value = null;
            }
          }
          
          // For text filters: check both original and normalized values
          // This allows users to search by either "Bachelors" or "BE/B.Tech"
          if (!value) return false;
          
          const filterLower = filterValue.toLowerCase();
          const valueStr = String(value).toLowerCase();
          
          // Check original value
          if (valueStr.includes(filterLower)) return true;
          
          // For degree/specialization/institution: also check normalized value
          if (column === 'degree') {
            const normalizedValue = normalizeDegree(value);
            if (String(normalizedValue).toLowerCase().includes(filterLower)) return true;
          } else if (column === 'specialization') {
            const normalizedValue = normalizeSpecialization(student.degree, value);
            if (String(normalizedValue).toLowerCase().includes(filterLower)) return true;
          } else if (column === 'institution') {
            const normalizedValue = normalizeInstitution(value);
            if (String(normalizedValue).toLowerCase().includes(filterLower)) return true;
          }
          
          // Handle array fields (like skills)
          if (Array.isArray(value)) {
            return value.some(item => 
              String(item).toLowerCase().includes(filterLower)
            );
          }
          
          return false;
        });
      }
    });
    
    // Apply multi-select filters
    Object.keys(columnMultiFilters).forEach(column => {
      const selectedValues = columnMultiFilters[column];
      if (selectedValues && Array.isArray(selectedValues) && selectedValues.length > 0) {
        filtered = filtered.filter(student => {
          let value = student[column];
          
          // Special handling for location column
          if (column === 'location') {
            if (student.location) {
              value = student.location;
            } else if (student.currentLocation) {
              value = student.currentLocation;
            } else if (student.preferredLocations && student.preferredLocations.length > 0) {
              // For preferredLocations, check if any matches
              return selectedValues.some(selectedVal => {
                const selectedStr = String(selectedVal).toLowerCase().trim();
                return student.preferredLocations.some(loc => 
                  String(loc).toLowerCase().trim() === selectedStr
                );
              });
            } else {
              value = null;
            }
          }
          
          // Use original value for filtering (strict filtering on actual data)
          // No normalization during filtering - filters work on original database values
          
          // If student doesn't have this field, exclude them
          if (value === null || value === undefined || value === '') {
            return false;
          }
          
          // Handle array fields (like skills) - check if any selected value matches any skill
          if (Array.isArray(value)) {
            return selectedValues.some(selectedVal => {
              const selectedStr = String(selectedVal).toLowerCase().trim();
              return value.some(item => String(item).toLowerCase().trim() === selectedStr);
            });
          }
          
          // For single values, match against original database value
          // Also handle normalization for degree/specialization/institution
          const studentValue = String(value).toLowerCase().trim();
          return selectedValues.some(selectedVal => {
            const selectedStr = String(selectedVal).toLowerCase().trim();
            
            // Direct match on original database value (most common case)
            if (studentValue === selectedStr) return true;
            
            // For degree: check if student's value normalizes to selected value, or vice versa
            if (column === 'degree' && value) {
              const normalizedStudentValue = normalizeDegree(value);
              if (String(normalizedStudentValue).toLowerCase().trim() === selectedStr) return true;
              // Reverse check: if selected value normalizes to student's original value
              const normalizedSelectedValue = normalizeDegree(selectedVal);
              if (studentValue === String(normalizedSelectedValue).toLowerCase().trim()) return true;
            }
            
            // For specialization: check normalized value
            if (column === 'specialization' && value) {
              const normalizedStudentValue = normalizeSpecialization(student.degree, value);
              if (String(normalizedStudentValue).toLowerCase().trim() === selectedStr) return true;
            }
            
            // For institution: check normalized value
            if (column === 'institution' && value) {
              const normalizedStudentValue = normalizeInstitution(value);
              if (String(normalizedStudentValue).toLowerCase().trim() === selectedStr) return true;
            }
            
            return false;
          });
        });
      }
    });
    
    setFilteredStudents(filtered);
  }, [columnFilters, columnMultiFilters, students]);

  const handleColumnFilterChange = (column, value) => {
    setColumnFilters(prev => ({
      ...prev,
      [column]: value
    }));
  };

  const handleColumnMultiFilterToggle = (column, value) => {
    setColumnMultiFilters(prev => {
      const current = prev[column] || [];
      const isSelected = current.some(v => String(v).toLowerCase() === String(value).toLowerCase());
      
      let newValues;
      if (isSelected) {
        // Remove the value
        newValues = current.filter(v => String(v).toLowerCase() !== String(value).toLowerCase());
      } else {
        // Add the value
        newValues = [...current, value];
      }
      
      const updated = {
        ...prev,
        [column]: newValues.length > 0 ? newValues : undefined
      };
      
      // Remove the key entirely if empty to clean up state
      if (newValues.length === 0) {
        const { [column]: removed, ...rest } = updated;
        return rest;
      }
      
      return updated;
    });
  };

  const toggleColumnFilterDropdown = (column) => {
    setColumnFilterDropdowns(prev => {
      const newState = { ...prev };
      // Close all other dropdowns when opening a new one
      if (!prev[column]) {
        Object.keys(newState).forEach(key => {
          if (key !== column) {
            newState[key] = false;
          }
        });
      }
      newState[column] = !prev[column];
      return newState;
    });
  };

  // Get unique values for a column for multi-select options
  const getColumnUniqueValues = (column) => {
    const values = new Set();
    
    // Make sure we're using the full students array, not filtered
    const studentsToProcess = students.length > 0 ? students : [];
    
    studentsToProcess.forEach(student => {
      if (!student) return;
      
      let value = student[column];
      
      // Special handling for location column
      if (column === 'location') {
        if (student.location) {
          value = student.location;
        } else if (student.currentLocation) {
          value = student.currentLocation;
        } else if (student.preferredLocations && student.preferredLocations.length > 0) {
          // For preferredLocations, add each location separately
          student.preferredLocations.forEach(loc => {
            if (loc !== null && loc !== undefined && String(loc).trim() !== '') {
              values.add(String(loc).trim());
            }
          });
          value = null; // Skip the rest of the processing for this student
        } else {
          value = null;
        }
      }
      
      // For degree column, also check alternative field names
      if (column === 'degree' && !value) {
        // Try alternative field names that might contain degree information
        value = student.degree || student.education?.degree || student.qualification || null;
      }
      
      // For strict filtering: show original database values in dropdown
      // This ensures filters work on actual data, not normalized display values
      // Display will still be normalized in table/cards
      
      // Include all non-null, non-undefined values
      if (value !== null && value !== undefined) {
        if (Array.isArray(value)) {
          value.forEach(item => {
            if (item !== null && item !== undefined && String(item).trim() !== '') {
              values.add(String(item).trim());
            }
          });
        } else {
          const stringValue = String(value).trim();
          // Add the value if it's not empty
          if (stringValue !== '') {
            values.add(stringValue);
          }
        }
      }
    });
    
    // Return sorted unique values - ONLY from actual database values
    // This ensures filters work on real data, not hypothetical values
    return Array.from(values).sort();
  };

  if (!isIndustry) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600">Only Industry users can access the student database.</p>
        </div>
      </div>
    );
  }

  // Dashboard View
  if (viewMode === 'dashboard') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        {/* Hero Carousel */}
        <div className="relative h-96 bg-gradient-to-r from-blue-600 to-indigo-700 overflow-hidden">
          <div className="absolute inset-0">
            <img 
              src={carouselData[currentCarouselIndex].image} 
              alt={carouselData[currentCarouselIndex].title}
              className="w-full h-full object-cover opacity-30"
            />
          </div>
          <div className="relative z-10 h-full flex items-center justify-center text-white px-4">
            <div className="text-center max-w-4xl">
              <h1 className="text-5xl font-bold mb-4">{carouselData[currentCarouselIndex].title}</h1>
              <p className="text-xl mb-8">{carouselData[currentCarouselIndex].description}</p>
              <div className="flex gap-4 justify-center flex-wrap">
                <button
                  onClick={() => setShowSearchForm(true)}
                  className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors shadow-lg"
                >
                  🔍 Search Resume by Keyword
                </button>
                <button
                  onClick={() => {
                    setViewMode('table');
                    fetchStudents();
                  }}
                  className="bg-indigo-600 text-white px-8 py-3 rounded-lg font-semibold text-lg hover:bg-indigo-700 transition-colors shadow-lg border-2 border-white/30"
                >
                  📋 View Student List
                </button>
              </div>
            </div>
          </div>
          
          {/* Carousel Indicators */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-20">
            {carouselData.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentCarouselIndex(index)}
                className={`h-2 rounded-full transition-all ${
                  index === currentCarouselIndex ? 'w-8 bg-white' : 'w-2 bg-white/50'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Industry Icons Grid */}
        <div className="max-w-7xl mx-auto px-4 py-12">
          {/* <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Browse Students by Industry</h2>
            <button
              onClick={() => {
                setViewMode('table');
                fetchStudents();
              }}
              className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors shadow-md flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              View Student List
            </button>
          </div> */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-6">
            {industryIcons.map((industry, index) => (
              <div
                key={index}
                className="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-2 text-center"
                onClick={() => handleIndustryIconClick(industry)}
              >
                <div className={`${industry.color} w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl`}>
                  {industry.icon}
                </div>
                <p className="font-semibold text-gray-800 text-sm">{industry.name}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Search Form Modal - Redesigned */}
        {showSearchForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-8 py-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-3xl font-bold mb-2">🔍 Search Resume by Keyword</h2>
                    <p className="text-blue-100">Find the perfect candidates with advanced filters</p>
                  </div>
                  <button
                    onClick={() => setShowSearchForm(false)}
                    className="text-white hover:bg-white/20 p-2 rounded-full transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              
              {/* Form Content */}
              <div className="flex-1 overflow-y-auto p-8 bg-gray-50">
                <div className="space-y-8">
                  {/* Keyword Search Section */}
                  <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">Search Keywords</h3>
                    </div>
                    <input
                      type="text"
                      placeholder="Search by name, skill, college, or any keyword..."
                      value={filters.keyword}
                      onChange={(e) => handleFilterChange('root', 'keyword', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400"
                    />
                  </div>

                  {/* Job Role & Experience Section */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Job Role */}
                    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">Job Role</h3>
                      </div>
                      <select
                        value={filters.jobRole}
                        onChange={(e) => handleFilterChange('root', 'jobRole', e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900"
                      >
                        <option value="">All Roles</option>
                        {filterOptions.jobRoles.map(role => (
                          <option key={role} value={role}>{role}</option>
                        ))}
                      </select>
                    </div>

                    {/* Years of Experience */}
                    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">Years of Experience</h3>
                      </div>
                      <select
                        value={filters.experienceYears}
                        onChange={(e) => handleFilterChange('root', 'experienceYears', e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-gray-900"
                      >
                        <option value="">All Experience Levels</option>
                        {filterOptions.experienceYears.map(years => (
                          <option key={years} value={years}>{years}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Education Section */}
                  <div className="grid grid-cols-1 gap-6">

                    {/* Education */}
                    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">Education</h3>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Degree</label>
                          <select
                            value={filters.education.degree}
                            onChange={(e) => handleFilterChange('education', 'degree', e.target.value)}
                            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900"
                          >
                            <option value="">Select Degree</option>
                            {filterOptions.degrees.map(degree => (
                              <option key={degree} value={degree}>{degree}</option>
                            ))}
                          </select>
                        </div>
                        {filters.education.degree && filterOptions.streams[filters.education.degree] && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Stream/Specialization</label>
                            <select
                              value={filters.education.stream}
                              onChange={(e) => handleFilterChange('education', 'stream', e.target.value)}
                              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900"
                            >
                              <option value="">Select Stream</option>
                              {filterOptions.streams[filters.education.degree].map(stream => (
                                <option key={stream} value={stream}>{stream}</option>
                              ))}
                            </select>
                          </div>
                        )}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Graduation Year</label>
                          <select
                            value={filters.education.year}
                            onChange={(e) => handleFilterChange('education', 'year', e.target.value)}
                            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900"
                          >
                            <option value="">Select Year</option>
                            {filterOptions.years.map(year => (
                              <option key={year} value={year}>{year}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Location Section */}
                  <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">Location</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                        <select
                          value={filters.location.state}
                          onChange={(e) => handleFilterChange('location', 'state', e.target.value)}
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900"
                        >
                          <option value="">Select State</option>
                          {filterOptions.states.map(state => (
                            <option key={state} value={state}>{state}</option>
                          ))}
                        </select>
                      </div>
                      {filters.location.state && filterOptions.cities[filters.location.state] && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                          <select
                            value={filters.location.city}
                            onChange={(e) => handleFilterChange('location', 'city', e.target.value)}
                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900"
                          >
                            <option value="">Select City</option>
                            {filterOptions.cities[filters.location.state].map(city => (
                              <option key={city} value={city}>{city}</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Additional Filters Section */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 bg-pink-100 rounded-lg flex items-center justify-center">
                          <svg className="w-4 h-4 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <label className="text-sm font-semibold text-gray-900">Gender</label>
                      </div>
                      <select
                        value={filters.gender}
                        onChange={(e) => handleFilterChange('root', 'gender', e.target.value)}
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-gray-900"
                      >
                        <option value="">Select Gender</option>
                        {filterOptions.genders.map(gender => (
                          <option key={gender} value={gender}>{gender}</option>
                        ))}
                      </select>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                          <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        </div>
                        <label className="text-sm font-semibold text-gray-900">College</label>
                      </div>
                      <input
                        type="text"
                        placeholder="Enter college name..."
                        value={filters.college}
                        onChange={(e) => handleFilterChange('root', 'college', e.target.value)}
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 placeholder-gray-400"
                      />
                    </div>
                    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 bg-cyan-100 rounded-lg flex items-center justify-center">
                          <svg className="w-4 h-4 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                          </svg>
                        </div>
                        <label className="text-sm font-semibold text-gray-900">Skills</label>
                      </div>
                      <input
                        type="text"
                        placeholder="e.g., Python, React..."
                        value={filters.skills}
                        onChange={(e) => handleFilterChange('root', 'skills', e.target.value)}
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-gray-900 placeholder-gray-400"
                      />
                    </div>
                  </div>

                  {/* Resume & Activity Section */}
                  <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">Resume & Activity Filters</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Resume Available</label>
                        <select
                          value={filters.resumeAvailability}
                          onChange={(e) => handleFilterChange('root', 'resumeAvailability', e.target.value)}
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-900"
                        >
                          <option value="">All Candidates</option>
                          <option value="with_resume">With Resume Only</option>
                          <option value="without_resume">Without Resume</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Recently Updated</label>
                        <select
                          value={filters.lastUpdatedWithin}
                          onChange={(e) => handleFilterChange('root', 'lastUpdatedWithin', e.target.value)}
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-900"
                        >
                          <option value="">Any Time</option>
                          <option value="10_days">Last 10 Days</option>
                          <option value="4_weeks">Last 4 Weeks</option>
                          <option value="1_year">Last 1 Year</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                        <select
                          value={filters.sortBy}
                          onChange={(e) => handleFilterChange('root', 'sortBy', e.target.value)}
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-900"
                        >
                          <option value="">Relevance (Default)</option>
                          <option value="recent_update">Recently Updated Profile</option>
                          <option value="profile_completeness">Profile Completeness</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="bg-white border-t border-gray-200 px-8 py-6 flex gap-4">
                <button
                  onClick={handleSearch}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:from-blue-700 hover:to-indigo-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  🔍 Search Now
                </button>
                <button
                  onClick={handleClearFilters}
                  className="px-8 py-4 border-2 border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Clear All
                </button>
                <button
                  onClick={() => setShowSearchForm(false)}
                  className="px-8 py-4 border-2 border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Table View
  if (viewMode === 'table') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Student Database - Table View</h1>
            <div className="flex gap-3">
              <button
                onClick={handleClearFilters}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 text-gray-700"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Reset Filters
              </button>
              <button
                onClick={() => setViewMode('dashboard')}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                ← Back to Dashboard
              </button>
              {selectedStudents.size > 0 && (
                <button
                  onClick={handleDownloadProfiles}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
                >
                  📥 Download {selectedStudents.size} Profile(s)
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="w-full px-4 py-6">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* Pagination Info */}
            {filteredStudents.length > 0 && (
              <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredStudents.length)} of {filteredStudents.length} students
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600">Items per page:</label>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={30}>30</option>
                    <option value={50}>50</option>
                  </select>
                </div>
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="w-full divide-y divide-gray-200 table-fixed">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase w-8">
                      <input
                        type="checkbox"
                        checked={selectedStudents.size === filteredStudents.length && filteredStudents.length > 0}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase w-8">#</th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase w-28">
                      <div className="space-y-1">
                        <div>Name</div>
                        <input
                          type="text"
                          placeholder="Filter..."
                          value={columnFilters.fullName || ''}
                          onChange={(e) => handleColumnFilterChange('fullName', e.target.value)}
                          className="w-full px-1 py-0.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase w-32">
                      <div className="space-y-1">
                        <div>Email</div>
                        <input
                          type="text"
                          placeholder="Filter..."
                          value={columnFilters.email || ''}
                          onChange={(e) => handleColumnFilterChange('email', e.target.value)}
                          className="w-full px-1 py-0.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase w-24">
                      <MultiSelectColumnFilter
                        column="degree"
                        label="Degree"
                        selectedValues={columnMultiFilters.degree || []}
                        onToggle={handleColumnMultiFilterToggle}
                        options={getColumnUniqueValues('degree')}
                        isOpen={columnFilterDropdowns.degree}
                        onToggleDropdown={() => toggleColumnFilterDropdown('degree')}
                        onClear={() => setColumnMultiFilters(prev => ({ ...prev, degree: undefined }))}
                      />
                    </th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase w-28">
                      <MultiSelectColumnFilter
                        column="specialization"
                        label="Specialization"
                        selectedValues={columnMultiFilters.specialization || []}
                        onToggle={handleColumnMultiFilterToggle}
                        options={getColumnUniqueValues('specialization')}
                        isOpen={columnFilterDropdowns.specialization}
                        onToggleDropdown={() => toggleColumnFilterDropdown('specialization')}
                        onClear={() => setColumnMultiFilters(prev => ({ ...prev, specialization: undefined }))}
                      />
                    </th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase w-32">
                      <div className="space-y-1">
                        <div>College</div>
                        <input
                          type="text"
                          placeholder="Filter..."
                          value={columnFilters.institution || ''}
                          onChange={(e) => handleColumnFilterChange('institution', e.target.value)}
                          className="w-full px-1 py-0.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase relative w-24">
                      <MultiSelectColumnFilter
                        column="location"
                        label="Location"
                        selectedValues={columnMultiFilters.location || []}
                        onToggle={handleColumnMultiFilterToggle}
                        options={getColumnUniqueValues('location')}
                        isOpen={columnFilterDropdowns.location}
                        onToggleDropdown={() => toggleColumnFilterDropdown('location')}
                        onClear={() => setColumnMultiFilters(prev => ({ ...prev, location: undefined }))}
                      />
                    </th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase relative w-32">
                      <MultiSelectColumnFilter
                        column="skills"
                        label="Skills"
                        selectedValues={columnMultiFilters.skills || []}
                        onToggle={handleColumnMultiFilterToggle}
                        options={getColumnUniqueValues('skills')}
                        isOpen={columnFilterDropdowns.skills}
                        onToggleDropdown={() => toggleColumnFilterDropdown('skills')}
                        onClear={() => setColumnMultiFilters(prev => ({ ...prev, skills: undefined }))}
                      />
                    </th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase w-20">Resume</th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase w-16">View</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredStudents
                    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                    .map((student, index) => (
                    <tr key={student.studentId} className="hover:bg-gray-50">
                      <td className="px-2 py-2">
                        <input
                          type="checkbox"
                          checked={selectedStudents.has(student.studentId)}
                          onChange={(e) => handleSelectStudent(student.studentId, e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-2 py-2 text-xs font-medium text-gray-900">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                      <td className="px-2 py-2">
                        <div className="flex items-center min-w-0">
                          {student.profilePictureBase64 ? (
                            <img
                              src={`data:image/jpeg;base64,${student.profilePictureBase64}`}
                              alt={student.fullName}
                              className="w-6 h-6 rounded-full mr-1.5 flex-shrink-0"
                            />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center mr-1.5 flex-shrink-0">
                              <span className="text-[10px] font-bold text-white">
                                {student.fullName?.charAt(0) || '?'}
                              </span>
                            </div>
                          )}
                          <span className="text-xs font-medium text-gray-900 truncate">{student.fullName}</span>
                        </div>
                      </td>
                      <td className="px-2 py-2 text-xs text-gray-500 truncate" title={student.email}>{student.email || '-'}</td>
                      <td className="px-2 py-2 text-xs text-gray-500 truncate">{normalizeDegree(student.degree)}</td>
                      <td className="px-2 py-2 text-xs text-gray-500 truncate">{normalizeSpecialization(student.degree, student.specialization)}</td>
                      <td className="px-2 py-2 text-xs text-gray-500 truncate" title={normalizeInstitution(student.institution)}>{normalizeInstitution(student.institution)}</td>
                      <td className="px-2 py-2 text-xs text-gray-500 truncate max-w-[6rem]" title={
                        student.location || 
                        (student.preferredLocations && student.preferredLocations.length > 0 ? student.preferredLocations.join(', ') : null) ||
                        student.currentLocation || 
                        '-'
                      }>
                        <span className="truncate block">
                          {student.location || 
                           (student.preferredLocations && student.preferredLocations.length > 0 ? student.preferredLocations.join(', ') : null) ||
                           student.currentLocation || 
                           '-'}
                        </span>
                      </td>
                      <td className="px-2 py-2 text-xs text-gray-500">
                        {student.skills && Array.isArray(student.skills) && student.skills.length > 0 ? (
                          <div className="flex flex-wrap gap-0.5">
                            {student.skills.slice(0, 2).map((skill, i) => (
                              <span key={i} className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[10px] rounded truncate max-w-full">
                                {skill}
                              </span>
                            ))}
                            {student.skills.length > 2 && (
                              <span className="text-[10px] text-gray-400">+{student.skills.length - 2}</span>
                            )}
                          </div>
                        ) : '-'}
                      </td>
                      <td className="px-2 py-2 text-xs">
                        {student.resumeAvailable ? (
                          <span className="px-1.5 py-0.5 bg-green-100 text-green-800 rounded text-[10px] font-medium">Yes</span>
                        ) : (
                          <span className="px-1.5 py-0.5 bg-gray-100 text-gray-800 rounded text-[10px] font-medium">No</span>
                        )}
                      </td>
                      <td className="px-2 py-2 text-xs">
                        <button
                          onClick={() => handleViewProfile(student)}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredStudents.length === 0 && !loading && (
              <div className="text-center py-12">
                <p className="text-gray-500">No students found</p>
              </div>
            )}

            {/* Pagination Controls */}
            {filteredStudents.length > itemsPerPage && (
              <div className="px-4 py-4 border-t border-gray-200 flex items-center justify-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    currentPage === 1
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  ← Previous
                </button>
                
                {/* Page Numbers */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.ceil(filteredStudents.length / itemsPerPage) }, (_, i) => i + 1)
                    .filter(page => {
                      const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
                      if (totalPages <= 7) return true;
                      if (page === 1 || page === totalPages) return true;
                      if (Math.abs(page - currentPage) <= 1) return true;
                      return false;
                    })
                    .map((page, index, array) => {
                      const prevPage = array[index - 1];
                      const showEllipsis = prevPage && page - prevPage > 1;
                      
                      return (
                        <React.Fragment key={page}>
                          {showEllipsis && (
                            <span className="px-2 text-gray-400">...</span>
                          )}
                          <button
                            onClick={() => setCurrentPage(page)}
                            className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                              currentPage === page
                                ? 'bg-blue-600 text-white'
                                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        </React.Fragment>
                      );
                    })}
                </div>
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(Math.ceil(filteredStudents.length / itemsPerPage), prev + 1))}
                  disabled={currentPage >= Math.ceil(filteredStudents.length / itemsPerPage)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    currentPage >= Math.ceil(filteredStudents.length / itemsPerPage)
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Cards Section - Vertical stack with equal height cards */}
        <div className="max-w-[1600px] mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Browse Students</h2>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">Items per page:</label>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1); // Reset to first page when changing items per page
                  }}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={30}>30</option>
                  <option value={50}>50</option>
                </select>
              </div>
              <button
                onClick={handleDownloadProfiles}
                disabled={selectedStudents.size === 0}
                className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
                  selectedStudents.size > 0
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                📥 Download Profiles ({selectedStudents.size})
              </button>
            </div>
          </div>
          
          {/* Pagination Info */}
          {filteredStudents.length > 0 && (
            <div className="mb-4 text-sm text-gray-600">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredStudents.length)} of {filteredStudents.length} students
            </div>
          )}
          
          {/* Student Cards */}
          <div className="space-y-4">
            {filteredStudents.length === 0 && !loading ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No students found</p>
              </div>
            ) : (
              filteredStudents
                .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                .map((student) => (
                  <StudentCard
                    key={student.studentId}
                    student={student}
                    isSelected={selectedStudents.has(student.studentId)}
                    onSelect={(checked) => handleSelectStudent(student.studentId, checked)}
                    onViewProfile={handleViewProfile}
                    onShortlist={handleShortlist}
                    onRemoveShortlist={handleRemoveShortlist}
                    normalizeDegree={normalizeDegree}
                    normalizeSpecialization={normalizeSpecialization}
                    normalizeInstitution={normalizeInstitution}
                  />
                ))
            )}
          </div>
          
          {/* Pagination Controls */}
          {filteredStudents.length > itemsPerPage && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  currentPage === 1
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                ← Previous
              </button>
              
              {/* Page Numbers */}
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.ceil(filteredStudents.length / itemsPerPage) }, (_, i) => i + 1)
                  .filter(page => {
                    const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
                    if (totalPages <= 7) return true;
                    if (page === 1 || page === totalPages) return true;
                    if (Math.abs(page - currentPage) <= 1) return true;
                    return false;
                  })
                  .map((page, index, array) => {
                    const prevPage = array[index - 1];
                    const showEllipsis = prevPage && page - prevPage > 1;
                    
                    return (
                      <React.Fragment key={page}>
                        {showEllipsis && (
                          <span className="px-2 text-gray-400">...</span>
                        )}
                        <button
                          onClick={() => setCurrentPage(page)}
                          className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                            currentPage === page
                              ? 'bg-blue-600 text-white'
                              : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      </React.Fragment>
                    );
                  })}
              </div>
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(Math.ceil(filteredStudents.length / itemsPerPage), prev + 1))}
                disabled={currentPage >= Math.ceil(filteredStudents.length / itemsPerPage)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  currentPage >= Math.ceil(filteredStudents.length / itemsPerPage)
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Next →
              </button>
            </div>
          )}
        </div>

        {/* Student Detail Modal */}
        {showDetailModal && selectedStudent && (
          <StudentDetailModal
            student={selectedStudent}
            subscriptionType={subscriptionType}
            onClose={() => {
              setShowDetailModal(false);
              setSelectedStudent(null);
              fetchStudents();
            }}
          />
        )}
      </div>
    );
  }

  return null;
}

// Multi-Select Column Filter Component
function MultiSelectColumnFilter({ column, label, selectedValues, onToggle, options, isOpen, onToggleDropdown, onClear }) {
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);
  const dropdownMenuRef = useRef(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const [searchText, setSearchText] = useState('');

  // Clear search text when dropdown closes
  useEffect(() => {
    if (!isOpen) {
      setSearchText('');
    }
  }, [isOpen]);

  // Calculate dropdown position when it opens
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const updatePosition = () => {
        if (buttonRef.current) {
          const buttonRect = buttonRef.current.getBoundingClientRect();
          setDropdownPosition({
            top: buttonRect.bottom + window.scrollY + 4,
            left: buttonRect.left + window.scrollX
          });
        }
      };
      
      updatePosition();
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
      
      return () => {
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [isOpen]);

  // Close dropdown when clicking outside (but not when clicking inside)
  useEffect(() => {
    if (!isOpen) return;
    
    const handleClickOutside = (event) => {
      // Only close if clicking completely outside both the button and dropdown
      const clickedButton = buttonRef.current && buttonRef.current.contains(event.target);
      const clickedDropdown = dropdownMenuRef.current && dropdownMenuRef.current.contains(event.target);
      
      if (!clickedButton && !clickedDropdown) {
        onToggleDropdown();
      }
    };
    
    // Use a longer delay to ensure checkbox clicks are processed
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 200);
    
    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onToggleDropdown]);

  const handleCheckboxChange = (e, option) => {
    e.stopPropagation();
    // Don't prevent default - let checkbox toggle naturally
    onToggle(column, option);
  };

  return (
    <>
      <div className="space-y-1 relative" ref={dropdownRef}>
        <div className="flex items-center justify-between">
          <div className="text-xs font-medium">{label}</div>
          {selectedValues.length > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onClear();
              }}
              className="text-[10px] text-red-600 hover:text-red-800 relative z-20"
              title="Clear filter"
            >
              ✕
            </button>
          )}
        </div>
        <div className="relative">
          <button
            ref={buttonRef}
            onClick={(e) => {
              e.stopPropagation();
              onToggleDropdown();
            }}
            className={`w-full px-1 py-0.5 text-xs border rounded focus:ring-1 focus:ring-blue-500 text-left flex items-center justify-between ${
              selectedValues.length > 0 ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
            }`}
          >
            <span className="truncate">
              {selectedValues.length > 0 ? `${selectedValues.length} selected` : 'Filter...'}
            </span>
            <svg
              className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>
      {isOpen && (
        <div 
          ref={dropdownMenuRef}
          className="fixed z-[9999] w-56 max-h-60 bg-white border-2 border-blue-200 rounded-lg shadow-2xl overflow-y-auto"
          style={{ 
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
            maxWidth: '90vw'
          }}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onMouseUp={(e) => e.stopPropagation()}
        >
            <div className="p-2">
              {/* Search input for filtering options */}
              <div className="mb-2 sticky top-0 bg-white z-10 pb-2 border-b border-gray-200">
                <input
                  type="text"
                  placeholder={`Search ${label.toLowerCase()}...`}
                  value={searchText}
                  onChange={(e) => {
                    e.stopPropagation();
                    setSearchText(e.target.value);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  onMouseUp={(e) => e.stopPropagation()}
                  className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  autoFocus
                />
              </div>
              
              {/* Filter options based on search text */}
              {(() => {
                const filteredOptions = options.filter(option => 
                  String(option).toLowerCase().includes(searchText.toLowerCase())
                );
                
                return filteredOptions.length > 0 ? (
                  <>
                    {filteredOptions.map((option, index) => (
                    <label
                      key={index}
                      className="flex items-center px-2 py-1.5 hover:bg-gray-100 cursor-pointer text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                      }}
                      onMouseUp={(e) => {
                        e.stopPropagation();
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedValues.some(v => String(v).toLowerCase() === String(option).toLowerCase())}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleCheckboxChange(e, option);
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                        onMouseDown={(e) => {
                          e.stopPropagation();
                        }}
                        onMouseUp={(e) => {
                          e.stopPropagation();
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2 cursor-pointer"
                      />
                      <span className="truncate">{option}</span>
                    </label>
                    ))}
                    {/* Optional: Add a close button for better UX */}
                    {filteredOptions.length > 5 && (
                    <div className="border-t border-gray-200 mt-2 pt-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleDropdown();
                        }}
                        className="w-full text-xs text-center text-blue-600 hover:text-blue-800 py-1"
                      >
                        Done
                      </button>
                    </div>
                    )}
                  </>
                ) : (
                  <div className="px-2 py-2 text-xs text-gray-500">
                    {searchText ? `No results found for "${searchText}"` : 'No options available'}
                  </div>
                );
              })()}
            </div>
          </div>
        )}
    </>
  );
}

// Student Card Component - Vertical list with horizontal layout inside
function StudentCard({ student, isSelected, onSelect, onViewProfile, onShortlist, onRemoveShortlist, normalizeDegree, normalizeSpecialization, normalizeInstitution }) {
  const handleDownloadResume = async (e, studentId) => {
    e.stopPropagation();
    try {
      await downloadResume(studentId);
    } catch (error) {
      console.error('Error downloading resume:', error);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div
      className={`bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 p-5 border cursor-pointer ${
        isSelected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'
      }`}
      style={{ minHeight: '250px' }}
      onClick={() => onViewProfile(student)}
    >
      <div className="flex items-start gap-4">
        {/* Checkbox on the left */}
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => {
            e.stopPropagation();
            onSelect(e.target.checked);
          }}
          onClick={(e) => e.stopPropagation()}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-5 h-5 mt-1 flex-shrink-0"
        />
        
        {/* Profile Picture */}
        <div className="flex-shrink-0">
          {student.profilePictureBase64 ? (
            <img
              src={`data:image/jpeg;base64,${student.profilePictureBase64}`}
              alt={student.fullName}
              className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
              <span className="text-2xl font-bold text-white">
                {student.fullName?.charAt(0) || '?'}
              </span>
            </div>
          )}
        </div>

        {/* Main Content - Horizontal Layout */}
        <div className="flex-grow min-w-0">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-grow">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-lg text-gray-900">
                  {student.fullName}
                </h3>
                {student.isPremium && (
                  <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded">
                    PREMIUM
                  </span>
                )}
              </div>
              {(student.location || student.currentLocation || (student.preferredLocations && student.preferredLocations.length > 0)) && (
                <p className="text-sm text-gray-600">
                  {student.location || 
                   student.currentLocation || 
                   (student.preferredLocations && student.preferredLocations.length > 0 ? student.preferredLocations.join(', ') : '')}
                </p>
              )}
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center gap-2 flex-shrink-0 ml-4" onClick={(e) => e.stopPropagation()}>
              {student.resumeAvailable && (
                <button
                  onClick={(e) => handleDownloadResume(e, student.studentId)}
                  className="px-3 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download Resume
                </button>
              )}
              <button
                className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                Show Contact
              </button>
            </div>
          </div>

          {/* Education */}
          <div className="mb-3">
            {student.degree && (
              <p className="text-sm text-gray-700">
                <span className="font-semibold">{normalizeDegree ? normalizeDegree(student.degree) : student.degree}</span>
                {student.specialization && (
                  <span className="text-gray-600">, {normalizeSpecialization ? normalizeSpecialization(student.degree, student.specialization) : student.specialization}</span>
                )}
                {student.institution && (
                  <span className="text-gray-600"> from {normalizeInstitution ? normalizeInstitution(student.institution) : student.institution}</span>
                )}
                {student.graduationYear && (
                  <span className="text-gray-600"> in {student.graduationYear}</span>
                )}
                {student.cgpa && (
                  <span className="text-gray-600"> with {student.cgpa} / 10 Mark</span>
                )}
              </p>
            )}
          </div>

          {/* Work Experience */}
          {(student.workExperience || student.designation || student.company) && (
            <div className="mb-3">
              <p className="text-sm text-gray-700">
                {student.workExperience && (
                  <span className="font-semibold">{student.workExperience} Experience</span>
                )}
                {student.designation && student.company && (
                  <span className="text-gray-600">
                    {student.workExperience ? ' - ' : ''}
                    {student.designation} at {student.company}
                  </span>
                )}
                {student.lastDrawnSalary && (
                  <span className="text-gray-600"> | Last Drawn Salary: Rs.{student.lastDrawnSalary} per Annum</span>
                )}
              </p>
            </div>
          )}

          {/* Preferred Career Options */}
          {student.preferredCareerOptions && student.preferredCareerOptions.length > 0 && (
            <div className="mb-3">
              <p className="text-sm text-gray-700">
                <span className="font-semibold">Preferred Career: </span>
                <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded text-xs">
                  {student.preferredCareerOptions.join(', ')}
                </span>
              </p>
            </div>
          )}

          {/* Languages Known */}
          {student.languagesKnown && student.languagesKnown.length > 0 && (
            <div className="mb-3">
              <p className="text-sm text-gray-700">
                <span className="font-semibold">Languages: </span>
                <span className="text-gray-600">{student.languagesKnown.join(', ')}</span>
              </p>
            </div>
          )}

          {/* Skills - Horizontal Layout */}
          {student.skills && student.skills.length > 0 && (
            <div className="mb-3">
              <div className="flex flex-wrap gap-2">
                {student.skills.slice(0, 10).map((skill, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded font-medium"
                  >
                    {skill}
                  </span>
                ))}
                {student.skills.length > 10 && (
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded font-medium">
                    +{student.skills.length - 10} more
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Last Active */}
          {(student.lastActive || student.lastUpdated) && (
            <div className="mb-3">
              <p className="text-xs text-gray-500">
                Last Active: {formatDate(student.lastActive || student.lastUpdated)}
              </p>
            </div>
          )}

          {/* Footer - Contact Icons */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                </svg>
                <span className="text-sm text-green-600">✓</span>
              </div>
              <div className="flex items-center gap-1">
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
                <span className="text-sm text-green-600">✓</span>
              </div>
            </div>
            {student.isShortlisted ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveShortlist(student.studentId, e);
                }}
                className="p-2 rounded-full bg-yellow-100 text-yellow-600 hover:bg-yellow-200 transition-colors"
                title="Remove from shortlist"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </button>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onShortlist(student.studentId, e);
                }}
                className="p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                title="Add to shortlist"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
