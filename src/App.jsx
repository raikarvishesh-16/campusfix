import { useEffect, useState } from 'react'
import './App.css'
import { auth, db } from "./firebase"

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "firebase/auth"

import {
  doc,
  setDoc,
  serverTimestamp,
  collection,
  addDoc,
  query,
  where,
  getDocs,
  getDoc,
  updateDoc
} from "firebase/firestore"

function App() {
  console.log("Firebase connected:", auth, db)

  const [showSplash, setShowSplash] = useState(true)
  const [currentPage, setCurrentPage] = useState('welcome')
  
  // NEW: State to hold the fetched logged-in user's profile
  const [userData, setUserData] = useState(null)

  const [complaintData, setComplaintData] = useState({
    title: '',
    category: '',
    description: '',
    location: ''
  })

  // ONE PHOTO PER COMPLAINT
  const [complaintPhoto, setComplaintPhoto] = useState(null)
  const [photoPreview, setPhotoPreview] = useState('')
  const [photoUploading, setPhotoUploading] = useState(false)

  // LISTEN FOR AUTH CHANGES AND FETCH USER PROFILE
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        // User is logged in, fetch their Firestore document
        try {
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          if (userDoc.exists()) {
            setUserData(userDoc.data());
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      } else {
        // User is logged out
        setUserData(null);
      }
    });

    return () => unsubscribe(); // Cleanup listener on unmount
  }, []);

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file.')
      e.target.value = ''
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Please choose an image smaller than 5 MB.')
      e.target.value = ''
      return
    }

    if (photoPreview) URL.revokeObjectURL(photoPreview)
    setComplaintPhoto(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  const handleRemovePhoto = () => {
    if (photoPreview) URL.revokeObjectURL(photoPreview)
    setComplaintPhoto(null)
    setPhotoPreview('')
    const galleryInput = document.getElementById('complaint-gallery-input')
    if (galleryInput) galleryInput.value = ''
  }

  const uploadComplaintPhoto = async (file) => {
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

    if (!cloudName || !uploadPreset) {
      throw new Error('Photo storage is not configured yet. Please add the Cloudinary settings to the .env file.')
    }

    const uploadData = new FormData()
    uploadData.append('file', file)
    uploadData.append('upload_preset', uploadPreset)
    uploadData.append('folder', 'campusfix/complaint-photos')

    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: uploadData
    })

    const result = await response.json()
    if (!response.ok) {
      throw new Error(result.error?.message || 'Photo upload failed.')
    }

    return {
      photoUrl: result.secure_url,
      photoPublicId: result.public_id
    }
  }

  // MY COMPLAINTS STATE
  const [myComplaints, setMyComplaints] = useState([])
  const [complaintsLoading, setComplaintsLoading] = useState(false)
  const [authorityComplaints, setAuthorityComplaints] = useState([])
  const [authorityLoading, setAuthorityLoading] = useState(false)
  const [authorityFilter, setAuthorityFilter] = useState('All')

  const [authorityData, setAuthorityData] = useState({
    email: '',
    password: ''
  })

  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  })

  const handleLoginChange = (e) => {
    const { name, value } = e.target

    setLoginData((prev) => ({
      ...prev,
      [name]: value
    }))
  }

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    prNumber: '',
    department: '',
    course: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student'
  })

  const handleChange = (e) => {
    const { name, value } = e.target

    setFormData((prev) => ({
      ...prev,
      [name]: value
    }))
  }

  // COMPLAINT FORM CHANGE HANDLER
  const handleComplaintChange = (e) => {
    const { name, value } = e.target

    setComplaintData((prev) => ({
      ...prev,
      [name]: value
    }))
  }

  // SUBMIT COMPLAINT TO FIREBASE
  const handleSubmitComplaint = async (e) => {
    e.preventDefault()

    if (!auth.currentUser) {
      alert("Please log in before submitting a complaint.")
      setCurrentPage('login')
      return
    }

    try {
      setPhotoUploading(true)
      let photoDetails = {}

      if (complaintPhoto) {
        photoDetails = await uploadComplaintPhoto(complaintPhoto)
      }

      await addDoc(collection(db, "issues"), {
        title: complaintData.title.trim(),
        category: complaintData.category,
        description: complaintData.description.trim(),
        location: complaintData.location.trim(),
        ...photoDetails,
        reportedBy: auth.currentUser.uid,
        status: "Pending",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })

      alert("Complaint submitted successfully!")

      setComplaintData({
        title: '',
        category: '',
        description: '',
        location: ''
      })
      handleRemovePhoto()
      setCurrentPage('dashboard')

    } catch (error) {
      console.error("Complaint submission error:", error)
      alert("Failed to submit complaint: " + error.message)
    } finally {
      setPhotoUploading(false)
    }
  }

  // LOAD COMPLAINTS SUBMITTED BY THE CURRENT USER
  const handleViewMyComplaints = async () => {
    if (!auth.currentUser) {
      alert("Please log in to view your complaints.")
      setCurrentPage('login')
      return
    }

    setCurrentPage('my-complaints')
    setComplaintsLoading(true)

    try {
      const complaintsQuery = query(
        collection(db, "issues"),
        where("reportedBy", "==", auth.currentUser.uid)
      )

      const querySnapshot = await getDocs(complaintsQuery)

      const complaints = querySnapshot.docs.map((document) => ({
        id: document.id,
        ...document.data()
      }))

      // Sort newest complaints first.
      complaints.sort((a, b) => {
        const dateA = a.createdAt?.toMillis?.() ?? 0
        const dateB = b.createdAt?.toMillis?.() ?? 0
        return dateB - dateA
      })

      setMyComplaints(complaints)
    } catch (error) {
      console.error("Loading complaints error:", error)
      alert("Could not load complaints: " + error.message)
    } finally {
      setComplaintsLoading(false)
    }
  }

  // REGISTRATION FUNCTION
  const handleRegister = async (e) => {
    e.preventDefault()

    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match!")
      return
    }

    if (formData.password.length < 6) {
      alert("Password must be at least 6 characters.")
      return
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email.trim(),
        formData.password
      )

      await setDoc(doc(db, "users", userCredential.user.uid), {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        name: `${formData.firstName.trim()} ${formData.lastName.trim()}`,
        prNumber: formData.prNumber.trim(),
        department: formData.department.trim(),
        course: formData.course,
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        role: formData.role,
        createdAt: serverTimestamp()
      })

      alert("Account created successfully! Please log in.")
      setCurrentPage('login')

    } catch (error) {
      console.error("Registration error:", error)
      alert(error.message)
    }
  }

  // LOGIN FUNCTION
  const handleLogin = async (e) => {
    e.preventDefault()

    try {
      await signInWithEmailAndPassword(
        auth,
        loginData.email.trim(),
        loginData.password
      )

      alert("Login successful!")
      setCurrentPage('dashboard')

    } catch (error) {
      console.error("Login error:", error)
      alert("Login failed: " + error.message)
    }
  }

  // LOAD ALL COMPLAINTS FOR THE VERIFIED HIGHER AUTHORITY
  const handleLoadAuthorityComplaints = async () => {
    if (!auth.currentUser) {
      alert("Please log in as Higher Authority.")
      setCurrentPage('authority-login')
      return
    }

    setAuthorityLoading(true)
    try {
      // Verify the account role again before loading all campus complaints.
      const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid))
      if (!userDoc.exists() || userDoc.data().role !== "authority") {
        await signOut(auth)
        setCurrentPage('welcome')
        alert("Access denied. Higher Authority account required.")
        return
      }

      const snapshot = await getDocs(collection(db, "issues"))
      const complaints = snapshot.docs.map((document) => ({
        id: document.id,
        ...document.data()
      }))

      complaints.sort((a, b) => {
        const dateA = a.createdAt?.toMillis?.() ?? 0
        const dateB = b.createdAt?.toMillis?.() ?? 0
        return dateB - dateA
      })
      setAuthorityComplaints(complaints)
    } catch (error) {
      console.error("Loading all complaints error:", error)
      alert("Could not load complaints: " + error.message)
    } finally {
      setAuthorityLoading(false)
    }
  }

  // UPDATE COMPLAINT STATUS (Firestore rules allow this only for authority)
  const handleUpdateComplaintStatus = async (complaintId, newStatus) => {
    try {
      await updateDoc(doc(db, "issues", complaintId), {
        status: newStatus,
        updatedAt: serverTimestamp()
      })

      setAuthorityComplaints((previous) =>
        previous.map((complaint) =>
          complaint.id === complaintId
            ? { ...complaint, status: newStatus }
            : complaint
        )
      )
      alert("Complaint status updated successfully!")
    } catch (error) {
      console.error("Status update error:", error)
      alert("Could not update status: " + error.message)
    }
  }

  // HIGHER AUTHORITY LOGIN
  const handleAuthorityLogin = async (e) => {
    e.preventDefault()

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        authorityData.email.trim(),
        authorityData.password
      )

      const userDoc = await getDoc(
        doc(db, "users", userCredential.user.uid)
      )

      if (!userDoc.exists() || userDoc.data().role !== "authority") {
        await signOut(auth)
        alert("Access denied. Higher Authority account required.")
        return
      }

      alert("Higher Authority login successful!")
      setCurrentPage('authority-dashboard')
      await handleLoadAuthorityComplaints()
    } catch (error) {
      console.error("Authority login error:", error)
      alert("Login failed: " + error.message)
    }
  }

  // Release the local photo preview URL when the component is removed.
  useEffect(() => {
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview)
    }
  }, [photoPreview])

  // SPLASH SCREEN
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false)
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

  if (showSplash) {
    return (
      <main className="splash-screen">
        <div className="splash-logo">CF</div>
        <h1>CampusFix</h1>
        <p>Report. Track. Resolve.</p>
        <div className="loader"></div>
      </main>
    )
  }

  // STUDENT / FACULTY ACCESS CHOICE PAGE (Mobile UI)
  if (currentPage === 'access-choice') {
    return (
      <main className="app-screen">
        <div className="screen-header" style={{ marginTop: '20px', textAlign: 'left' }}>
          <button onClick={() => setCurrentPage('welcome')} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', marginBottom: '24px', color: '#142b4a' }}>←</button>
          <h1>Welcome back!</h1>
          <p>Choose how you want to continue.</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '24px' }}>
          <div 
            onClick={() => setCurrentPage('login')}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px', background: 'white', borderRadius: '16px', border: '1px solid #e1e8f0', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '48px', height: '48px', background: '#f0f5fa', borderRadius: '12px', display: 'grid', placeItems: 'center', fontSize: '24px' }}>🎓</div>
              <div style={{ textAlign: 'left' }}>
                <strong style={{ display: 'block', color: '#142b4a', fontSize: '16px' }}>Student / Faculty</strong>
                <span style={{ color: '#718198', fontSize: '13px' }}>Login / Register</span>
              </div>
            </div>
            <span style={{ color: '#142b4a', fontSize: '20px' }}>→</span>
          </div>

          <div 
            onClick={() => setCurrentPage('authority-login')}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px', background: 'white', borderRadius: '16px', border: '1px solid #e1e8f0', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '48px', height: '48px', background: '#f0f5fa', borderRadius: '12px', display: 'grid', placeItems: 'center', fontSize: '24px' }}>🛡️</div>
              <div style={{ textAlign: 'left' }}>
                <strong style={{ display: 'block', color: '#142b4a', fontSize: '16px' }}>Higher Authority</strong>
                <span style={{ color: '#718198', fontSize: '13px' }}>Login</span>
              </div>
            </div>
            <span style={{ color: '#142b4a', fontSize: '20px' }}>→</span>
          </div>
        </div>
      </main>
    )
  }

  // STUDENT / FACULTY LOGIN PAGE (Mobile UI)
  if (currentPage === 'login') {
    return (
      <main className="app-screen">
        <div className="screen-header">
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', background: '#142b4a', borderRadius: '12px', color: 'white', fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>CF</div>
          <h2 style={{ color: '#142b4a', fontSize: '20px', fontWeight: '800', marginBottom: '4px' }}>CampusFix</h2>
          <h1 style={{ marginTop: '24px' }}>Welcome back!</h1>
          <p>Sign in to continue</p>
        </div>

        <form className="mobile-form" onSubmit={handleLogin}>
          <div className="input-group">
            <input type="email" name="email" value={loginData.email} onChange={handleLoginChange} placeholder="College Email ID" required style={{ paddingLeft: '44px', backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'18\' height=\'18\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%23718198\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpath d=\'M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z\'%3E%3C/path%3E%3Cpolyline points=\'22,6 12,13 2,6\'%3E%3C/polyline%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: '16px center' }} />
          </div>

          <div className="input-group">
            <input type="password" name="password" value={loginData.password} onChange={handleLoginChange} placeholder="Password" required style={{ paddingLeft: '44px', backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'18\' height=\'18\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%23718198\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Crect x=\'3\' y=\'11\' width=\'18\' height=\'11\' rx=\'2\' ry=\'2\'%3E%3C/rect%3E%3Cpath d=\'M7 11V7a5 5 0 0 1 10 0v4\'%3E%3C/path%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: '16px center' }} />
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={{ color: '#718198', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}>Forgot Password?</span>
          </div>

          <button type="submit" className="btn-primary" style={{ marginTop: '24px' }}>Sign In</button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '24px', display: 'flex', alignItems: 'center', gap: '12px', color: '#718198', fontSize: '13px' }}>
          <div style={{ flex: 1, height: '1px', background: '#e1e8f0' }}></div>
          or
          <div style={{ flex: 1, height: '1px', background: '#e1e8f0' }}></div>
        </div>

        <button type="button" className="btn-text" onClick={() => setCurrentPage('register')} style={{ marginTop: '24px', border: '1px solid #e1e8f0', borderRadius: '12px', padding: '16px', background: 'white', color: '#142b4a' }}>
          Create Account
        </button>
        <button type="button" className="btn-text" onClick={() => setCurrentPage('access-choice')} style={{ marginTop: '16px' }}>Back</button>
      </main>
    )
  }

  // HIGHER AUTHORITY LOGIN PAGE
  if (currentPage === 'authority-login') {
    return (
      <main className="register-screen">
        <div className="register-card">
          <h1>Higher Authority Login</h1>
          <p>Sign in with your authorized account.</p>

          <form className="register-form" onSubmit={handleAuthorityLogin}>
            <label>Official Email ID</label>
            <input
              type="email"
              value={authorityData.email}
              onChange={(e) =>
                setAuthorityData((prev) => ({ ...prev, email: e.target.value }))
              }
              placeholder="Enter official email"
              required
            />

            <label>Password</label>
            <input
              type="password"
              value={authorityData.password}
              onChange={(e) =>
                setAuthorityData((prev) => ({ ...prev, password: e.target.value }))
              }
              placeholder="Enter password"
              required
            />

            <button type="submit" className="register-button">
              Login as Higher Authority
            </button>
          </form>

          <button type="button" onClick={() => setCurrentPage('welcome')}>
            Back to Home
          </button>
        </div>
      </main>
    )
  }

  // HIGHER AUTHORITY DASHBOARD
  if (currentPage === 'authority-dashboard') {
    const filteredAuthorityComplaints = authorityFilter === 'All'
      ? authorityComplaints
      : authorityComplaints.filter((complaint) => (complaint.status || 'Pending') === authorityFilter)

    const pendingCount = authorityComplaints.filter((item) => (item.status || 'Pending') === 'Pending').length
    const progressCount = authorityComplaints.filter((item) => item.status === 'In Progress').length
    const resolvedCount = authorityComplaints.filter((item) => item.status === 'Resolved').length

    return (
      <main className="register-screen" style={{ alignItems: 'flex-start', padding: '24px 14px' }}>
        <div className="register-card" style={{ width: '100%', maxWidth: '1000px', boxSizing: 'border-box' }}>
          <h1>Higher Authority Dashboard</h1>
          <p>Review campus complaints and update their progress.</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px', margin: '22px 0' }}>
            <div style={{ background: '#fff4e5', borderRadius: '12px', padding: '14px' }}>
              <strong style={{ display: 'block', fontSize: '26px' }}>{pendingCount}</strong>
              <span>Pending</span>
            </div>
            <div style={{ background: '#eaf2ff', borderRadius: '12px', padding: '14px' }}>
              <strong style={{ display: 'block', fontSize: '26px' }}>{progressCount}</strong>
              <span>In Progress</span>
            </div>
            <div style={{ background: '#e9f8ef', borderRadius: '12px', padding: '14px' }}>
              <strong style={{ display: 'block', fontSize: '26px' }}>{resolvedCount}</strong>
              <span>Resolved</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
            <label style={{ flex: '1 1 180px' }}>
              Filter complaints
              <select
                value={authorityFilter}
                onChange={(e) => setAuthorityFilter(e.target.value)}
                style={{ display: 'block', width: '100%', marginTop: '6px', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
              >
                <option value="All">All complaints</option>
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
              </select>
            </label>
            <button type="button" className="register-button" onClick={handleLoadAuthorityComplaints}>
              Refresh Complaints
            </button>
          </div>

          {authorityLoading ? (
            <p>Loading campus complaints...</p>
          ) : filteredAuthorityComplaints.length === 0 ? (
            <p>No complaints found for this filter.</p>
          ) : (
            <div style={{ display: 'grid', gap: '14px' }}>
              {filteredAuthorityComplaints.map((complaint) => (
                <article key={complaint.id} style={{ border: '1px solid #dbe2ea', borderRadius: '12px', padding: '16px', textAlign: 'left', overflowWrap: 'anywhere' }}>
                  <h3 style={{ marginTop: 0, marginBottom: '10px' }}>{complaint.title || 'Untitled complaint'}</h3>
                  <p><strong>Report ID:</strong> {complaint.id}</p>
                  <p><strong>Category:</strong> {complaint.category || 'Not specified'}</p>
                  <p><strong>Location:</strong> {complaint.location || 'Not specified'}</p>
                  <p><strong>Description:</strong> {complaint.description || 'No description provided'}</p>
                  {complaint.photoUrl && (
                    <div style={{ margin: '12px 0' }}>
                      <strong>Attached Photo:</strong>
                      <a href={complaint.photoUrl} target="_blank" rel="noreferrer">
                        <img src={complaint.photoUrl} alt="Complaint evidence" style={{ display: 'block', width: '100%', maxWidth: '280px', maxHeight: '220px', objectFit: 'cover', borderRadius: '10px', marginTop: '8px' }} />
                      </a>
                    </div>
                  )}
                  <p><strong>Reported:</strong> {complaint.createdAt?.toDate ? complaint.createdAt.toDate().toLocaleString() : 'Date unavailable'}</p>
                  <label style={{ display: 'block', marginTop: '12px', fontWeight: 600 }}>
                    Complaint status
                    <select
                      value={complaint.status || 'Pending'}
                      onChange={(e) => handleUpdateComplaintStatus(complaint.id, e.target.value)}
                      style={{ display: 'block', width: '100%', maxWidth: '320px', marginTop: '6px', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff' }}
                    >
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Resolved">Resolved</option>
                    </select>
                  </label>
                </article>
              ))}
            </div>
          )}

          <button
            type="button"
            style={{ marginTop: '22px' }}
            onClick={async () => {
              await signOut(auth)
              setAuthorityData({ email: '', password: '' })
              setAuthorityComplaints([])
              setCurrentPage('welcome')
            }}
          >
            Logout
          </button>
        </div>
      </main>
    )
  }

  // REGISTRATION PAGE
  if (currentPage === 'register') {
    return (
      <main className="register-screen">
        <div className="register-card">
          <h1>Create Account</h1>
          <p>Join CampusFix and help improve your campus.</p>

          <form className="register-form" onSubmit={handleRegister}>
            <label>First Name</label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              placeholder="Enter first name"
              required
            />

            <label>Last Name</label>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              placeholder="Enter last name"
              required
            />

            <label>PR Number</label>
            <input
              type="text"
              name="prNumber"
              value={formData.prNumber}
              onChange={handleChange}
              placeholder="Enter PR number"
              required
            />

            <label>Department</label>
            <input
              type="text"
              name="department"
              value={formData.department}
              onChange={handleChange}
              placeholder="Enter department"
              required
            />

            <label>Course</label>
            <select
              name="course"
              value={formData.course}
              onChange={handleChange}
              required
            >
              <option value="">Select course</option>
              <option value="Computer Science">Computer Science</option>
              <option value="MCA">MCA</option>
            </select>

            <label>Phone Number</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Enter phone number"
              required
            />

            <label>College Email ID</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter college email"
              required
            />

            <label>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Create password"
              required
            />

            <label>Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm password"
              required
            />

            <label>Account Type</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              required
            >
              <option value="student">Student</option>
              <option value="faculty">Faculty</option>
            </select>

            <button type="submit" className="register-button">
              Create Account
            </button>
          </form>

          <button
            type="button"
            onClick={() => setCurrentPage('access-choice')}
          >
            Back
          </button>
        </div>
      </main>
    )
  }

  // REPORT COMPLAINT PAGE
  if (currentPage === 'complaint') {
    return (
      <main className="register-screen">
        <div className="register-card">
          <h1>Report a Campus Issue</h1>
          <p>Tell us about the problem on your campus.</p>

          <form
            className="register-form"
            onSubmit={handleSubmitComplaint}
          >
            <label>Complaint Title</label>
            <input
              type="text"
              name="title"
              value={complaintData.title}
              onChange={handleComplaintChange}
              placeholder="Enter complaint title"
              required
            />

            <label>Category</label>
            <select
              name="category"
              value={complaintData.category}
              onChange={handleComplaintChange}
              required
            >
              <option value="">Select category</option>
              <option value="Electrical">Electrical</option>
              <option value="Plumbing">Plumbing</option>
              <option value="Cleanliness">Cleanliness</option>
              <option value="Furniture">Furniture</option>
              <option value="Internet">Internet</option>
              <option value="Other">Other</option>
            </select>

            <label>Description</label>
            <textarea
              name="description"
              value={complaintData.description}
              onChange={handleComplaintChange}
              placeholder="Describe the issue..."
              rows="4"
              required
            />

            <label>Campus Location</label>
            <input
              type="text"
              name="location"
              value={complaintData.location}
              onChange={handleComplaintChange}
              placeholder="Enter building or room location"
              required
            />

            <label>Photo Evidence (Optional — one photo)</label>
            <p style={{ margin: '0 0 8px', color: '#64748b', fontSize: '14px' }}>
              Choose one image of the issue from your gallery. Maximum size: 5 MB.
            </p>
            <input
              id="complaint-gallery-input"
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              style={{ display: 'block', width: '100%', margin: '10px 0' }}
            />
            <label htmlFor="complaint-gallery-input" style={{ fontSize: '13px' }}>Choose from gallery</label>

            {photoPreview && (
              <div style={{ margin: '12px 0', textAlign: 'left' }}>
                <strong>Photo preview</strong>
                <img src={photoPreview} alt="Selected complaint evidence preview" style={{ display: 'block', width: '100%', maxWidth: '280px', maxHeight: '220px', objectFit: 'cover', borderRadius: '10px', marginTop: '8px' }} />
                <button type="button" onClick={handleRemovePhoto} style={{ marginTop: '8px' }}>
                  Remove Photo
                </button>
              </div>
            )}

            <button type="submit" className="register-button" disabled={photoUploading}>
              {photoUploading ? 'Uploading Photo...' : 'Submit Complaint'}
            </button>

            <button
              type="button"
              onClick={() => setCurrentPage('dashboard')}
            >
              Back to Dashboard
            </button>
          </form>
        </div>
      </main>
    )
  }

  // MY COMPLAINTS TRACKING PAGE
  if (currentPage === 'my-complaints') {
    return (
      <main className="register-screen">
        <div className="register-card">
          <h1>My Complaints</h1>
          <p>Track the progress of the issues you have reported.</p>

          {complaintsLoading ? (
            <p>Loading your complaints...</p>
          ) : myComplaints.length === 0 ? (
            <p>You have not submitted any complaints yet.</p>
          ) : (
            <div className="complaints-list">
              {myComplaints.map((complaint) => (
                <div className="complaint-item" key={complaint.id}>
                  <h3>{complaint.title}</h3>
                  <p><strong>Report ID:</strong> {complaint.id}</p>
                  <p><strong>Category:</strong> {complaint.category}</p>
                  <p><strong>Location:</strong> {complaint.location}</p>
                  <p><strong>Description:</strong> {complaint.description}</p>
                  {complaint.photoUrl && (
                    <div style={{ margin: '10px 0', textAlign: 'left' }}>
                      <strong>Attached Photo:</strong>
                      <a href={complaint.photoUrl} target="_blank" rel="noreferrer">
                        <img src={complaint.photoUrl} alt="Your complaint evidence" style={{ display: 'block', width: '100%', maxWidth: '260px', maxHeight: '200px', objectFit: 'cover', borderRadius: '10px', marginTop: '8px' }} />
                      </a>
                    </div>
                  )}
                  <p>
                    <strong>Date:</strong>{' '}
                    {complaint.createdAt?.toDate
                      ? complaint.createdAt.toDate().toLocaleString()
                      : 'Date unavailable'}
                  </p>
                  <p>
                    <strong>Status:</strong>{' '}
                    <span className={`complaint-status ${(complaint.status || 'Pending').toLowerCase().replace(/\s+/g, '-')}`}>
                      {complaint.status || 'Pending'}
                    </span>
                  </p>
                </div>
              ))}
            </div>
          )}

          <button
            type="button"
            className="register-button"
            onClick={handleViewMyComplaints}
          >
            Refresh Complaints
          </button>

          <button
            type="button"
            onClick={() => setCurrentPage('dashboard')}
          >
            Back to Dashboard
          </button>
        </div>
      </main>
    )
  }

  // STUDENT / FACULTY DASHBOARD
  if (currentPage === 'dashboard') {
    return (
      <main className="app-screen" style={{ paddingBottom: '80px' }}>
        
        <div className="screen-header" style={{ textAlign: 'left', marginTop: '10px' }}>
          <p style={{ margin: 0 }}>Good Morning,</p>
          <h1 style={{ fontSize: '24px' }}>{userData?.firstName || 'Student'} 👋</h1>
        </div>

        <div className="register-card" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '18px', color: '#142b4a', marginBottom: '16px' }}>Something broken? Report it now!</h2>
          <button
            className="btn-primary"
            style={{ margin: 0 }}
            onClick={() => setCurrentPage('complaint')}
          >
            + Report an Issue
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginTop: '24px', textAlign: 'center' }}>
           <div style={{ background: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #e1e8f0' }}>
             <h3 style={{ fontSize: '24px', color: '#f59e0b' }}>2</h3>
             <span style={{ fontSize: '12px', color: '#718198' }}>Pending</span>
           </div>
           <div style={{ background: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #e1e8f0' }}>
             <h3 style={{ fontSize: '24px', color: '#3b82f6' }}>1</h3>
             <span style={{ fontSize: '12px', color: '#718198' }}>In Progress</span>
           </div>
           <div style={{ background: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #e1e8f0' }}>
             <h3 style={{ fontSize: '24px', color: '#10b981' }}>4</h3>
             <span style={{ fontSize: '12px', color: '#718198' }}>Resolved</span>
           </div>
        </div>

        {/* BOTTOM NAVIGATION BAR */}
        <nav className="bottom-nav">
          <button className="nav-item active" onClick={() => setCurrentPage('dashboard')}>
            <span className="nav-icon">🏠</span>
            Home
          </button>
          <button className="nav-item" onClick={handleViewMyComplaints}>
            <span className="nav-icon">📋</span>
            My Issues
          </button>
          <button className="nav-item" onClick={() => setCurrentPage('complaint')}>
            <span className="nav-icon">➕</span>
            Report
          </button>
          <button className="nav-item" onClick={() => setCurrentPage('profile')}>
            <span className="nav-icon">👤</span>
            Profile
          </button>
        </nav>
      </main>
    )
  }

  // WELCOME PAGE (Mobile UI)
  return (
    <main className="app-screen" style={{ padding: 0, background: '#fff' }}>
      <div style={{ padding: '40px 24px 20px', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#142b4a', fontSize: '24px', fontWeight: '800' }}>
          <div style={{ width: '32px', height: '32px', background: '#142b4a', borderRadius: '8px', color: 'white', display: 'grid', placeItems: 'center', fontSize: '18px' }}>CF</div>
          CampusFix
        </div>
      </div>

      <div style={{ textAlign: 'center', padding: '0 24px', marginBottom: '24px' }}>
        <img src="https://img.freepik.com/free-vector/college-campus-concept-illustration_114360-10508.jpg" alt="Campus illustration" style={{ width: '100%', maxHeight: '200px', objectFit: 'contain' }} />
      </div>

      <div style={{ padding: '24px' }}>
        <h1 style={{ fontSize: '32px', color: '#142b4a', fontFamily: 'Manrope, sans-serif', fontWeight: '800', lineHeight: '1.2', marginBottom: '24px' }}>
          Your campus.<br/>Your voice. Your fix.
        </h1>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
             <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#eaf2fa', color: '#2f649b', display: 'grid', placeItems: 'center', fontSize: '20px' }}>📝</div>
             <div style={{ textAlign: 'left' }}>
               <strong style={{ display: 'block', color: '#142b4a', fontSize: '16px' }}>Report</strong>
               <span style={{ color: '#718198', fontSize: '14px' }}>Tell us what's wrong</span>
             </div>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
             <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#eaf2fa', color: '#2f649b', display: 'grid', placeItems: 'center', fontSize: '20px' }}>🔍</div>
             <div style={{ textAlign: 'left' }}>
               <strong style={{ display: 'block', color: '#142b4a', fontSize: '16px' }}>Track</strong>
               <span style={{ color: '#718198', fontSize: '14px' }}>See the progress</span>
             </div>
          </div>
           <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
             <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#eaf2fa', color: '#2f649b', display: 'grid', placeItems: 'center', fontSize: '20px' }}>✅</div>
             <div style={{ textAlign: 'left' }}>
               <strong style={{ display: 'block', color: '#142b4a', fontSize: '16px' }}>Resolve</strong>
               <span style={{ color: '#718198', fontSize: '14px' }}>Get it fixed</span>
             </div>
          </div>
        </div>

        <button className="btn-primary" onClick={() => setCurrentPage('access-choice')} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px' }}>
          Get Started <span>→</span>
        </button>
        
        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <span style={{ color: '#718198', fontSize: '14px' }}>Already have an account? </span>
          <button className="btn-text" style={{ display: 'inline', width: 'auto', padding: 0 }} onClick={() => setCurrentPage('login')}>Sign In</button>
        </div>
      </div>
    </main>
  )
}

export default App