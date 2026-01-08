package com.saarthix.jobs.config;

import com.saarthix.jobs.model.User;
import com.saarthix.jobs.model.UserProfile;
import com.saarthix.jobs.repository.UserRepository;
import com.saarthix.jobs.repository.UserProfileRepository;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.*;

@Component
public class DataSeeder {

    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;

    // Dummy data arrays
    private static final String[] FIRST_NAMES = {
        "Aarav", "Aditi", "Akshay", "Ananya", "Arjun", "Avni", "Dev", "Diya", "Ishaan", "Kavya",
        "Krishna", "Meera", "Neha", "Pranav", "Priya", "Rahul", "Riya", "Rohan", "Saanvi", "Samarth",
        "Shreya", "Siddharth", "Sneha", "Tanvi", "Ved", "Vidya", "Yash", "Zara", "Aryan", "Isha",
        "Kabir", "Maya", "Nikhil", "Pooja", "Raj", "Sara", "Varun", "Anika", "Dhruv", "Kriti",
        "Manav", "Nisha", "Om", "Radha", "Sahil", "Tara", "Vikram", "Aaliyah", "Arnav", "Ishita"
    };

    private static final String[] LAST_NAMES = {
        "Sharma", "Patel", "Kumar", "Singh", "Gupta", "Verma", "Reddy", "Mehta", "Joshi", "Shah",
        "Malhotra", "Agarwal", "Nair", "Iyer", "Menon", "Rao", "Desai", "Kapoor", "Chopra", "Bansal",
        "Goyal", "Khanna", "Saxena", "Tiwari", "Mishra", "Jain", "Bhatt", "Pandey", "Yadav", "Khan",
        "Ali", "Hussain", "Ahmed", "Kumar", "Das", "Bose", "Chatterjee", "Mukherjee", "Banerjee", "Ghosh",
        "Dutta", "Sengupta", "Basu", "Roy", "Mitra", "Saha", "Chakraborty", "Ganguly", "Biswas", "Mandal"
    };

    private static final String[] SKILLS_POOL = {
        "Java", "Python", "JavaScript", "React", "Node.js", "Spring Boot", "Angular", "Vue.js",
        "SQL", "MongoDB", "PostgreSQL", "MySQL", "AWS", "Docker", "Kubernetes", "Git",
        "HTML", "CSS", "TypeScript", "Express.js", "REST API", "GraphQL", "Microservices",
        "Machine Learning", "Data Science", "TensorFlow", "PyTorch", "Pandas", "NumPy",
        "C++", "C#", ".NET", "PHP", "Ruby", "Go", "Rust", "Swift", "Kotlin", "Flutter",
        "Android Development", "iOS Development", "UI/UX Design", "Figma", "Adobe XD",
        "Agile", "Scrum", "DevOps", "CI/CD", "Jenkins", "Linux", "System Design"
    };

    private static final String[] LOCATIONS = {
        "Mumbai, Maharashtra", "Delhi, Delhi", "Bangalore, Karnataka", "Hyderabad, Telangana",
        "Chennai, Tamil Nadu", "Pune, Maharashtra", "Kolkata, West Bengal", "Ahmedabad, Gujarat",
        "Jaipur, Rajasthan", "Surat, Gujarat", "Lucknow, Uttar Pradesh", "Kanpur, Uttar Pradesh",
        "Nagpur, Maharashtra", "Indore, Madhya Pradesh", "Thane, Maharashtra", "Bhopal, Madhya Pradesh",
        "Visakhapatnam, Andhra Pradesh", "Patna, Bihar", "Vadodara, Gujarat", "Ghaziabad, Uttar Pradesh"
    };

    private static final String[] ROLES = {
        "Software Engineer", "Full Stack Developer", "Backend Developer", "Frontend Developer",
        "DevOps Engineer", "Data Scientist", "Machine Learning Engineer", "QA Engineer",
        "UI/UX Designer", "Product Manager", "Business Analyst", "System Administrator",
        "Mobile App Developer", "Cloud Architect", "Security Engineer", "Database Administrator"
    };

    private static final String[] COMPANIES = {
        "TechCorp", "InnovateLabs", "Digital Solutions", "CloudTech", "DataSystems", "WebWorks",
        "AppDev Inc", "CodeMasters", "FutureTech", "SmartSolutions", "NextGen IT", "ProSoft",
        "GlobalTech", "InnovationHub", "TechVenture", "DigitalEdge", "CodeForge", "TechNova",
        "SoftServe", "DevStudio", "TechFlow", "CodeCraft", "InnovateSoft", "TechBridge"
    };

    private static final String[] DEGREES = {
        "B.Tech", "B.E.", "B.Sc", "B.Com", "BBA", "BCA", "M.Tech", "M.E.", "M.Sc", "MBA", "MCA", "MS"
    };

    private static final String[] STREAMS = {
        "Computer Science", "Information Technology", "Electronics", "Mechanical", "Civil",
        "Electrical", "Data Science", "Artificial Intelligence", "Business Administration",
        "Commerce", "Science", "Mathematics", "Physics", "Chemistry"
    };

    private static final String[] INSTITUTIONS = {
        "IIT Delhi", "IIT Bombay", "IIT Madras", "IIT Kanpur", "IIT Kharagpur", "IIT Roorkee",
        "NIT Trichy", "NIT Surathkal", "NIT Warangal", "BITS Pilani", "IIIT Hyderabad",
        "Delhi University", "Mumbai University", "Bangalore University", "Anna University",
        "Jadavpur University", "Calcutta University", "Pune University", "Osmania University"
    };

    private static final String[] GENDERS = {"Male", "Female", "Other", "Prefer not to say"};
    private static final String[] WORK_PREFERENCES = {"Remote", "On-site", "Hybrid"};
    private static final String[] AVAILABILITY_OPTIONS = {"Immediately", "1 week notice", "2 weeks notice", "1 month notice"};

    public DataSeeder(UserRepository userRepository, UserProfileRepository userProfileRepository) {
        this.userRepository = userRepository;
        this.userProfileRepository = userProfileRepository;
    }

    public int seedUsers(int count) {
        System.out.println("Starting to seed " + count + " dummy users...");
        
        Random random = new Random();
        int seededCount = 0;
        int existingCount = (int) userRepository.count();
        
        System.out.println("Existing users in database: " + existingCount);
        
        for (int i = 0; i < count; i++) {
            try {
                // Generate unique email
                String email = generateUniqueEmail(random, i);
                
                // Check if user already exists
                if (userRepository.findByEmail(email).isPresent()) {
                    System.out.println("User with email " + email + " already exists, skipping...");
                    continue;
                }
                
                // Create User - match existing format: "User 16", "User 17", etc.
                int userNumber = 66 + i; // Start from 66
                String fullName = "User " + userNumber;
                String pictureUrl = "https://ui-avatars.com/api/?name=User+" + userNumber + "&background=random";
                
                User user = new User(fullName, email, pictureUrl, "APPLICANT");
                user = userRepository.save(user);
                
                // Create UserProfile
                UserProfile profile = createUserProfile(user, fullName, email, random, userNumber);
                userProfileRepository.save(profile);
                
                seededCount++;
                
                if (seededCount % 10 == 0) {
                    System.out.println("Seeded " + seededCount + " users so far...");
                }
                
            } catch (Exception e) {
                System.err.println("Error seeding user " + i + ": " + e.getMessage());
                e.printStackTrace();
            }
        }
        
        System.out.println("Seeding completed! Successfully seeded " + seededCount + " new users.");
        System.out.println("Total users in database: " + userRepository.count());
        return seededCount;
    }

    private String generateUniqueEmail(Random random, int index) {
        // Match existing format: user16@gmail.com, user17@gmail.com, etc.
        int userNumber = 66 + index; // Start from 66 (since you have 65 existing users)
        return "user" + userNumber + "@gmail.com";
    }

    private UserProfile createUserProfile(User user, String fullName, String email, Random random, int userNumber) {
        UserProfile profile = new UserProfile();
        
        // Basic Information - match existing format
        profile.setApplicantEmail(email);
        profile.setApplicantId(user.getId());
        profile.setFullName(fullName);
        profile.setEmail(email);
        // Phone number format: 9000000016 (number, not string)
        profile.setPhoneNumber(String.valueOf(9000000000L + userNumber));
        profile.setGender(GENDERS[random.nextInt(GENDERS.length)]);
        
        // Profile picture - match existing format: "user16.jpg"
        profile.setProfilePictureFileName("user" + userNumber + ".jpg");
        profile.setProfilePictureFileType("image/jpeg");
        profile.setProfilePictureBase64(null);
        profile.setProfilePictureFileSize(40000L + random.nextInt(20000)); // 40KB - 60KB
        
        // Resume - match existing format: "User16_Resume.pdf"
        profile.setResumeFileName("User" + userNumber + "_Resume.pdf");
        profile.setResumeFileType("application/pdf");
        profile.setResumeBase64(null);
        profile.setResumeFileSize(700000L + random.nextInt(300000)); // 700KB - 1MB
        
        // Professional Information
        String role = ROLES[random.nextInt(ROLES.length)];
        profile.setCurrentRole(role);
        profile.setCurrentRoles(Arrays.asList(role));
        profile.setCurrentPosition(role);
        profile.setCurrentCompany(COMPANIES[random.nextInt(COMPANIES.length)]);
        
        // Experience - match existing format: "1 Years"
        int yearsOfExp = random.nextInt(11);
        profile.setExperience(yearsOfExp + (yearsOfExp == 1 ? " Year" : " Years"));
        
        // Skills - store as List<String> (individual skills)
        int numSkills = 2 + random.nextInt(5); // 2-6 skills
        Set<String> selectedSkills = new HashSet<>();
        while (selectedSkills.size() < numSkills) {
            selectedSkills.add(SKILLS_POOL[random.nextInt(SKILLS_POOL.length)]);
        }
        List<String> skillsList = new ArrayList<>(selectedSkills);
        profile.setSkills(skillsList);
        
        // For display/reference
        String skillsString = String.join(",", skillsList);
        
        // Summary - match existing format
        profile.setSummary("Experienced " + role + " professional.");
        
        // Location
        String location = LOCATIONS[random.nextInt(LOCATIONS.length)];
        String[] locationParts = location.split(", ");
        profile.setCurrentLocationState(locationParts.length > 1 ? locationParts[1] : "");
        profile.setCurrentLocationCity(locationParts[0]);
        profile.setCurrentLocation(location);
        
        // Preferred Locations (1-3 locations)
        List<String> preferredLocations = new ArrayList<>();
        int numPreferred = 1 + random.nextInt(3);
        Set<String> selectedLocations = new HashSet<>();
        selectedLocations.add(location); // Include current location
        while (selectedLocations.size() < numPreferred) {
            selectedLocations.add(LOCATIONS[random.nextInt(LOCATIONS.length)]);
        }
        preferredLocations.addAll(selectedLocations);
        profile.setPreferredLocations(preferredLocations);
        profile.setPreferredLocation(preferredLocations.get(0));
        
        // Work Preference
        profile.setWorkPreference(WORK_PREFERENCES[random.nextInt(WORK_PREFERENCES.length)]);
        profile.setWillingToRelocate(random.nextBoolean());
        
        // Contact & Links - match existing format
        profile.setLinkedInUrl("https://linkedin.com/in/user" + userNumber);
        profile.setGithubUrl(null); // Match existing format (null)
        profile.setPortfolioUrl(null); // Match existing format (null)
        profile.setWebsiteUrl(null); // Match existing format (null)
        
        // Additional Information
        profile.setAvailability("Immediate"); // Match existing format
        // Expected salary - match existing format: 1200000 (number, not string)
        int expectedSalary = 800000 + random.nextInt(800000); // 8L to 16L
        profile.setExpectedSalary(String.valueOf(expectedSalary));
        
        // Cover letter template - match existing format
        profile.setCoverLetterTemplate("Cover letter for " + role + ".");
        
        // Professional Experiences
        List<UserProfile.ProfessionalExperience> experiences = new ArrayList<>();
        if (yearsOfExp > 0) {
            int numExperiences = Math.min(1 + random.nextInt(3), yearsOfExp);
            for (int i = 0; i < numExperiences; i++) {
                UserProfile.ProfessionalExperience exp = new UserProfile.ProfessionalExperience();
                exp.setJobTitle(ROLES[random.nextInt(ROLES.length)]);
                exp.setCompany(COMPANIES[random.nextInt(COMPANIES.length)]);
                int startYear = 2024 - yearsOfExp - i;
                exp.setStartDate("01/" + (1 + random.nextInt(12)) + "/" + startYear);
                if (i == 0 && random.nextBoolean()) {
                    exp.setIsCurrentJob(true);
                    exp.setEndDate("Present");
                } else {
                    exp.setIsCurrentJob(false);
                    exp.setEndDate("31/" + (1 + random.nextInt(12)) + "/" + (startYear + 1 + random.nextInt(2)));
                }
                exp.setDescription("Worked on developing and maintaining software applications. Collaborated with cross-functional teams to deliver high-quality products.");
                experiences.add(exp);
            }
        }
        profile.setProfessionalExperiences(experiences);
        
        // Education - match existing format (simplified)
        List<UserProfile.EducationEntry> educationEntries = new ArrayList<>();
        
        // Graduation (main education)
        UserProfile.EducationEntry graduation = new UserProfile.EducationEntry();
        graduation.setLevel("Graduation");
        graduation.setDegree(DEGREES[random.nextInt(DEGREES.length)]);
        graduation.setStream(STREAMS[random.nextInt(STREAMS.length)]);
        graduation.setInstitution(INSTITUTIONS[random.nextInt(INSTITUTIONS.length)]);
        graduation.setPassingYear(String.valueOf(2020 + random.nextInt(4)));
        graduation.setPercentage(String.valueOf(70 + random.nextInt(25)) + "%");
        educationEntries.add(graduation);
        
        profile.setEducationEntries(educationEntries);
        profile.setEducation("Graduation"); // Match existing format
        
        // Hobbies - match existing format (array of 3)
        String[] hobbiesPool = {"Reading", "Traveling", "Photography", "Cooking", "Gaming", "Music", "Sports", "Dancing", "Writing", "Painting"};
        List<String> hobbies = new ArrayList<>();
        Set<String> selectedHobbies = new HashSet<>();
        while (selectedHobbies.size() < 3) {
            selectedHobbies.add(hobbiesPool[random.nextInt(hobbiesPool.length)]);
        }
        hobbies.addAll(selectedHobbies);
        profile.setHobbies(hobbies);
        
        // Projects - match existing format (array of 1)
        List<UserProfile.Project> projects = new ArrayList<>();
        UserProfile.Project project = new UserProfile.Project();
        project.setName("Project: " + role + " Application");
        project.setDescription("A professional project demonstrating skills in " + skillsString + ".");
        project.setGithubLink("https://github.com/user" + userNumber + "/project");
        projects.add(project);
        profile.setProjects(projects);
        
        // Certifications - match existing format
        profile.setCertifications("Professional Certification");
        List<UserProfile.CertificationFile> certificationFiles = new ArrayList<>();
        UserProfile.CertificationFile cert = new UserProfile.CertificationFile();
        cert.setName("Professional Certification");
        cert.setFileName("User" + userNumber + "_Certification.pdf");
        cert.setFileType("application/pdf");
        cert.setFileBase64(null);
        cert.setFileSize(200000L + random.nextInt(100000)); // 200KB - 300KB
        cert.setIssuingOrganization("Professional Certification Board");
        cert.setIssueDate("01/01/2023");
        cert.setExpiryDate("01/01/2026");
        certificationFiles.add(cert);
        profile.setCertificationFiles(certificationFiles);
        
        // Timestamps - use current time (will be converted to ISO format by MongoDB)
        profile.setCreatedAt(LocalDateTime.now());
        profile.setLastUpdated(LocalDateTime.now());
        
        return profile;
    }
}

