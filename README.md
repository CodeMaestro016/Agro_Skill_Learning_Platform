# 🌿AgroSkill - Digital Platform for Agricultural Skill Development

![Image](https://github.com/user-attachments/assets/63d458b3-f702-424f-8370-03f54634433f)

## Welcome to AgroSkills – Empowering Farmers Through Knowledge!
AgroSkill is a professional networking and learning platform tailored for individuals passionate about agriculture. It helps users grow their skills, share knowledge, and connect with like-minded peers in the agro-tech industry.

---

## About the System
The AgroSkill platform serves as a one-stop hub for agricultural education, resources, and skill-building. Whether it’s pest management, irrigation techniques, or sustainable farming, users can explore curated modules designed to promote smart farming.

---

### Features include:
- Enable content sharing (text, video, learning materials).
- Enhance skill acquisition through structured learning plans.
- Promote networking among agricultural professionals and learners.

---

### Libraries and Frameworks:
🔧 Frontend
- **React + Vite**: Fast development with optimized builds.
- **Tailwind CSS**: Utility-first CSS framework for modern UI.

---

⚙️ Backend
- **Spring Boot**: Robust Java-based framework for REST APIs.
- **MongoDB**: A flexible NoSQL database for managing large volumes of data efficiently.

---

## Installation and Setup
### Prerequisites
- Install Springboot and Java JDK 21+.
- Create MongoDB Cluster.
- Ensure Create **.env** file and **application.properties** files under Resources.
- Ensure to Use **Cloudinary**

---

### Frontend Setup
1. Navigate to the frontend directory of the project.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the frontend server:
   ```bash
   npm run dev
   ```

---

### Backend Setup
1. Navigate to the backend directory.
2. Configure application.properties:
   ```bash
   MONGODB_URI= ###
   GOOGLE_CLIENT_ID= ###
   GOOGLE_CLIENT_SECRET= ###
   JWT_SECRET_KEY=your-new-jwt-secret

   cloudinary.cloud_name= ###
   cloudinary.api_key= ###
   cloudinary.api_secret= ###
   ```
3. Run the application using your preferred IDE (IntelliJ, VsCode) or command line:
   ```
   ./mvnw spring-boot:run
   ```

---

## Key Features

✅ Post Creation: Share text updates, tips, and knowledge with the community.

🎥 Video Sharing: Upload and engage with agricultural learning videos.

📚 Learning Plans: Create structured modules to guide others through skill acquisition.

💬 Real-Time Chat: Message and collaborate with fellow learners or mentors.

❤️ Engagement Tools: Like, comment, and save useful posts and videos.

🔒 User Authentication: Secure login and role-based access (Spring Security recommended).

📈 Profile Building: Showcase your achievements, skills, and activity.

---

## Acknowledgments
This project was developed as part of the Programming Application & Framework Development course at SLIIT. Special thanks to the agricultural experts and contributers who inspired the concept and features of AgroSkills.

---

### Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.




