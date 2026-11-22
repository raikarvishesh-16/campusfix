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

function BottomNavigation({ currentPage, setCurrentPage, onViewMyComplaints }) {
  const activePage = ['complaint-details'].includes(currentPage)
    ? 'my-complaints'
    : currentPage === 'notifications'
      ? 'dashboard'
      : currentPage

  return (
    <nav className="bottom-nav" aria-label="Main navigation">
      <button className={`nav-item ${activePage === 'dashboard' ? 'active' : ''}`} onClick={() => setCurrentPage('dashboard')}>
        <span className="nav-icon">⌂</span>
        Home
      </button>
      <button className={`nav-item ${activePage === 'my-complaints' ? 'active' : ''}`} onClick={onViewMyComplaints}>
        <span className="nav-icon">▤</span>
        My Issues
      </button>
      <button className={`nav-item ${activePage === 'complaint' ? 'active' : ''}`} onClick={() => setCurrentPage('complaint')}>
        <span className="nav-icon">＋</span>
        Report
      </button>
      <button className={`nav-item ${activePage === 'profile' ? 'active' : ''}`} onClick={() => setCurrentPage('profile')}>
        <span className="nav-icon">○</span>
        Profile
      </button>
    </nav>
  )
}

function AuthorityNavigation({ currentPage, onNavigate, onLogout }) {
  const tabs = [
    { page: 'authority-dashboard', label: 'Overview', icon: '⌂' },
    { page: 'authority-queue', label: 'Queue', icon: '▤' },
    { page: 'authority-analytics', label: 'Analytics', icon: '▥' }
  ]

  const renderTabs = (className) => (
    <nav className={className} aria-label="Authority navigation">
      {tabs.map((tab) => (
        <button type="button" className={currentPage === tab.page ? 'active' : ''} key={tab.page} onClick={() => onNavigate(tab.page)}>
          <span>{tab.icon}</span>{tab.label}
        </button>
      ))}
      <button type="button" className="authority-logout-tab" onClick={onLogout}><span>↪</span>Logout</button>
    </nav>
  )

  return (
    <>
      {renderTabs('authority-top-nav')}
      {renderTabs('authority-bottom-nav')}
    </>
  )
}

function AuthorityPortal({ currentPage, setCurrentPage, onLogout, children }) {
  return (
    <main className="app-screen authority-portal-screen">
      <div className="authority-container">
        <header className="authority-brandbar">
          <div className="authority-brandmark">CF</div>
          <div><strong>CampusFix</strong><span>OPERATIONS PORTAL</span></div>
          <span className="authority-verified">AUTHORIZED</span>
        </header>
        <AuthorityNavigation currentPage={currentPage} onNavigate={setCurrentPage} onLogout={onLogout} />
        {children}
      </div>
    </main>
  )
}

const categoryIcons = {
  Electrical: '⚡',
  Plumbing: '💧',
  Cleanliness: '✨',
  Furniture: '🪑',
  Internet: '📶',
  Other: '⌁'
}

const courses = ['MCA', 'Computer Science', 'M.Sc', 'MBA / IMBA', 'M.Com', 'MA', 'PhD', 'Other']

const departments = [
  'M.C.A Department',
  'Computer Science',
  'Botany',
  'Mathematics',
  'Physics',
  'School of Chemical Sciences',
  'Biotechnology',
  'Microbiology',
  'Zoology',
  'School of Earth Ocean & Atmospheric Science',
  'Electronics (USIC)',
  'Goa Business School (MBA / IMBA / Commerce)',
  'English',
  'Hindi',
  'Konkani',
  'Marathi',
  'French',
  'Portuguese',
  'History',
  'Economics',
  'Political Science',
  'Sociology',
  'Philosophy',
  "Women's Studies",
  'C.L.A.S',
  'H.R.D.C',
  'Administration / Estate Office'
]

const buildings = [
  { label: 'Pure Science Building (Block-A)', value: 'Block-A (Pure Science)' },
  { label: 'Arts Faculty Building (Block-B)', value: 'Block-B (Arts Faculty)' },
  { label: 'Applied Science Building (Block-C)', value: 'Block-C (Applied Science)' },
  { label: 'Old Management Building (Block-D)', value: 'Block-D (Old Management)' },
  { label: 'New Science Building (Block-E)', value: 'Block-E (New Science)' },
  { label: 'New Commerce Faculty (Block-F)', value: 'Block-F (New Commerce Faculty)' },
  { label: 'Computer Science Lab Building', value: 'Computer Science Lab Building' },
  { label: 'I.M.B.A Building', value: 'I.M.B.A Building' },
  { label: 'U.S.I.C Building', value: 'U.S.I.C Building' },
  { label: 'Library Building', value: 'Library Building' },
  { label: 'Administrative Building', value: 'Administrative Building' },
  { label: 'Examination Building', value: 'Examination Building' },
  { label: 'C.L.A.S Building', value: 'C.L.A.S Building' },
  { label: 'H.R.D.C Building', value: 'H.R.D.C Building' },
  { label: 'Faculty Canteen', value: 'Faculty Canteen' },
  { label: 'Gymnasium Building', value: 'Gymnasium Building' },
  { label: 'Sports Building', value: 'Sports Building' },
  { label: 'New Health Centre Building', value: 'New Health Centre Building' },
  { label: "Men's Hostel-I", value: "Men's Hostel-I" },
  { label: "Women's Hostel-I", value: "Women's Hostel-I" },
  { label: 'PhD Girls Hostel-I', value: 'PhD Girls Hostel-I' },
  { label: 'PhD Girls Hostel-II', value: 'PhD Girls Hostel-II' },
  { label: 'PhD Boys Hostel-II', value: 'PhD Boys Hostel-II' },
  { label: 'Renovated Ladies Hostel', value: 'Renovated Ladies Hostel' },
  { label: 'Guest House', value: 'Guest House' },
  { label: 'International Guest House', value: 'International Guest House' },
  { label: 'Shopping Centre Complex', value: 'Shopping Centre Complex' },
  { label: 'Residential Quarters', value: 'Residential Quarters' }
]

const authorityDivisions = [
  'Engineering & Technical Division',
  'Computer Centre / IT',
  'Office of Estate Admin & Allied Services',
  'Electrical Substation',
  'Housekeeping & Sanitation',
  'Hostel Warden Office'
]

function formatComplaintDate(timestamp, includeTime = false) {
  const date = timestamp?.toDate?.() || (timestamp instanceof Date ? timestamp : null)
  if (!date) return 'Date unavailable'

  return date.toLocaleString(undefined, includeTime
    ? { dateStyle: 'medium', timeStyle: 'short' }
    : { month: 'short', day: 'numeric', year: 'numeric' })
}

function App() {
  console.log("Firebase connected:", auth, db)

  const [showSplash, setShowSplash] = useState(true)
  const [currentPage, setCurrentPage] = useState('welcome')
  const [registerStep, setRegisterStep] = useState(1)
  const [complaintStep, setComplaintStep] = useState(1)
  const [complaintBuilding, setComplaintBuilding] = useState('')
  const [complaintSpot, setComplaintSpot] = useState('')
  const [lastSubmittedId, setLastSubmittedId] = useState('')
  const [selectedComplaint, setSelectedComplaint] = useState(null)
  const [complaintFilter, setComplaintFilter] = useState('All')
  const [complaintSearch, setComplaintSearch] = useState('')
  const [notificationFilter, setNotificationFilter] = useState('All')
  const [notificationsRead, setNotificationsRead] = useState(false)
  const [settingsDialog, setSettingsDialog] = useState(null)
  
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
  const [authoritySearch, setAuthoritySearch] = useState('')
  const [selectedAuthorityComplaint, setSelectedAuthorityComplaint] = useState(null)
  const [authorityDepartment, setAuthorityDepartment] = useState(authorityDivisions[0])
  const [authorityUpdateStatus, setAuthorityUpdateStatus] = useState('Pending')
  const [authorityInternalNote, setAuthorityInternalNote] = useState('')
  const [authorityAnalyticsPeriod, setAuthorityAnalyticsPeriod] = useState('This Week')

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
      const location = [complaintBuilding, complaintSpot.trim()].filter(Boolean).join(' - ')

      if (complaintPhoto) {
        photoDetails = await uploadComplaintPhoto(complaintPhoto)
      }

      const docRef = await addDoc(collection(db, "issues"), {
        title: complaintData.title.trim(),
        category: complaintData.category,
        description: complaintData.description.trim(),
        location,
        ...photoDetails,
        reportedBy: auth.currentUser.uid,
        status: "Pending",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })

      setLastSubmittedId(docRef.id)
      setMyComplaints((previous) => [{
        id: docRef.id,
        ...complaintData,
        title: complaintData.title.trim(),
        description: complaintData.description.trim(),
        location,
        ...photoDetails,
        status: 'Pending'
      }, ...previous])

      setComplaintData({
        title: '',
        category: '',
        description: '',
        location: ''
      })
      setComplaintBuilding('')
      setComplaintSpot('')
      handleRemovePhoto()
      setComplaintStep(1)
      setCurrentPage('submission-success')

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

  // Keep the dashboard's derived summaries current when it is opened.
  useEffect(() => {
    if (currentPage !== 'dashboard' || !auth.currentUser) return

    let active = true
    const loadDashboardComplaints = async () => {
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
        complaints.sort((a, b) => {
          const dateA = a.createdAt?.toMillis?.() ?? 0
          const dateB = b.createdAt?.toMillis?.() ?? 0
          return dateB - dateA
        })
        if (active) setMyComplaints(complaints)
      } catch (error) {
        console.error("Loading dashboard complaints error:", error)
        alert("Could not load complaints: " + error.message)
      } finally {
        if (active) setComplaintsLoading(false)
      }
    }

    loadDashboardComplaints()
    return () => { active = false }
  }, [currentPage])

  // REGISTRATION FUNCTION
  const handleRegister = async (e) => {
    e.preventDefault()
    if (registerStep !== 2) return

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
      setRegisterStep(1)
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
      const { email, password } = authorityData
      const normalizedEmail = email.trim().toLowerCase()
      const cred = await signInWithEmailAndPassword(auth, normalizedEmail, password)
      const authSnap = await getDoc(doc(db, 'authorized_authorities', normalizedEmail))

      if (!authSnap.exists() || authSnap.data().active !== true) {
        await signOut(auth)
        alert("Access Denied: Your email is not authorized for Higher Authority access.")
        return
      }

      const authorityProfile = authSnap.data()
      await setDoc(doc(db, 'users', cred.user.uid), {
        email: normalizedEmail,
        role: 'authority',
        name: authorityProfile.name || 'Authority',
        designation: authorityProfile.designation || 'Official'
      }, { merge: true })

      setCurrentPage('authority-dashboard')
      await handleLoadAuthorityComplaints()
    } catch (error) {
      console.error("Authority login error:", error)
      alert("Login failed: " + error.message)
    }
  }

  const openAuthorityComplaint = (complaint) => {
    const suggestedDepartments = {
      Electrical: 'Electrical Substation',
      Internet: 'Computer Centre / IT',
      Cleanliness: 'Housekeeping & Sanitation',
      Plumbing: 'Office of Estate Admin & Allied Services',
      Furniture: 'Engineering & Technical Division'
    }
    setSelectedAuthorityComplaint(complaint)
    setAuthorityDepartment(suggestedDepartments[complaint.category] || authorityDivisions[0])
    setAuthorityUpdateStatus(complaint.status || 'Pending')
    setAuthorityInternalNote('')
    setCurrentPage('authority-update')
  }

  const handleAuthorityLogout = async () => {
    await signOut(auth)
    setAuthorityData({ email: '', password: '' })
    setAuthorityComplaints([])
    setSelectedAuthorityComplaint(null)
    setCurrentPage('welcome')
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
      <main className="app-screen authority-login-screen">
        <div className="authority-login-card">
          <div className="authority-shield">🛡️</div>
          <span className="authority-login-kicker">CAMPUSFIX</span>
          <h1>CampusFix Operations Portal</h1>
          <p className="authority-login-subtitle">Authorized Personnel Only</p>

          <form className="authority-login-form" onSubmit={handleAuthorityLogin}>
            <label htmlFor="authority-email">Official Email</label>
            <input
              id="authority-email"
              type="email"
              value={authorityData.email}
              onChange={(e) => setAuthorityData((prev) => ({ ...prev, email: e.target.value }))}
              placeholder="name@campus.edu"
              autoComplete="username"
              required
            />
            <label htmlFor="authority-password">Password</label>
            <input
              id="authority-password"
              type="password"
              value={authorityData.password}
              onChange={(e) => setAuthorityData((prev) => ({ ...prev, password: e.target.value }))}
              placeholder="Enter your password"
              autoComplete="current-password"
              required
            />
            <button type="submit">Sign In</button>
          </form>
          <button type="button" className="authority-back-link" onClick={() => setCurrentPage('welcome')}>← Back to App</button>
          <p className="authority-security-note">Secure access for campus operations staff</p>
        </div>
      </main>
    )
  }

  // AUTHORITY OPERATIONS OVERVIEW
  if (currentPage === 'authority-dashboard') {
    const pendingCount = authorityComplaints.filter((item) => (item.status || 'Pending') === 'Pending').length
    const progressCount = authorityComplaints.filter((item) => item.status === 'In Progress').length
    const resolvedCount = authorityComplaints.filter((item) => item.status === 'Resolved').length
    const now = new Date()
    const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7))
    const weekdayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    const trendDays = weekdayLabels.map((label, index) => {
      const day = new Date(monday)
      day.setDate(monday.getDate() + index)
      const count = authorityComplaints.filter((complaint) => {
        const reportedAt = complaint.createdAt?.toDate?.()
        return reportedAt
          && reportedAt.getFullYear() === day.getFullYear()
          && reportedAt.getMonth() === day.getMonth()
          && reportedAt.getDate() === day.getDate()
      }).length
      return { label, count }
    })
    const maxTrendCount = Math.max(1, ...trendDays.map((day) => day.count))
    const trendPoints = trendDays.map((day, index) => ({
      x: 25 + index * 50,
      y: 112 - (day.count / maxTrendCount) * 78,
      ...day
    }))
    const trendPath = trendPoints.reduce((path, point, index) => {
      if (index === 0) return `M ${point.x} ${point.y}`
      const previous = trendPoints[index - 1]
      const midpoint = (previous.x + point.x) / 2
      return `${path} Q ${midpoint} ${previous.y} ${midpoint} ${(previous.y + point.y) / 2} Q ${point.x} ${point.y} ${point.x} ${point.y}`
    }, '')
    const trendAreaPath = `${trendPath} L ${trendPoints[trendPoints.length - 1].x} 126 L ${trendPoints[0].x} 126 Z`
    const urgentComplaints = authorityComplaints
      .filter((complaint) => (complaint.status || 'Pending') === 'Pending')
      .slice(0, 5)

    return (
      <AuthorityPortal currentPage={currentPage} setCurrentPage={setCurrentPage} onLogout={handleAuthorityLogout}>
        <header className="operations-heading">
          <div><span className="authority-eyebrow">CAMPUS OPERATIONS</span><h1>Operations Overview</h1><p>Monitor reports and coordinate campus response.</p></div>
          <div className="operations-actions"><span className="live-badge"><i />Live</span><button type="button" className="refresh-icon-button" aria-label="Refresh complaints" onClick={handleLoadAuthorityComplaints} disabled={authorityLoading}>{authorityLoading ? '…' : '↻'}</button></div>
        </header>

        <section className="authority-kpi-grid" aria-label="Complaint totals">
          <article className="authority-kpi pending-kpi"><span>Pending</span><strong>{pendingCount}</strong><small>Awaiting review</small><i>◷</i></article>
          <article className="authority-kpi progress-kpi"><span>In Progress</span><strong>{progressCount}</strong><small>Being addressed</small><i>↗</i></article>
          <article className="authority-kpi resolved-kpi"><span>Resolved</span><strong>{resolvedCount}</strong><small>Successfully closed</small><i>✓</i></article>
        </section>

        <section className="authority-panel trend-panel">
          <div className="authority-panel-heading"><div><h2>Complaints Trend</h2><p>Last 7 Days · Reports received per day</p></div><span className="chart-legend"><i />Reports</span></div>
          <div className="trend-chart">
            <svg viewBox="0 0 350 158" role="img" aria-label="Complaints received Monday through Sunday">
              <defs><linearGradient id="authorityTrendFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#2563eb" stopOpacity=".22" /><stop offset="100%" stopColor="#2563eb" stopOpacity="0" /></linearGradient></defs>
              {[34, 73, 112].map((y) => <line key={y} x1="25" y1={y} x2="325" y2={y} className="chart-grid-line" />)}
              <path d={trendAreaPath} fill="url(#authorityTrendFill)" />
              <path d={trendPath} className="trend-line" />
              {trendPoints.map((point) => <g key={point.label}><circle cx={point.x} cy={point.y} r="3.5" className="trend-point" /><text x={point.x} y="148" textAnchor="middle" className="chart-day-label">{point.label}</text></g>)}
            </svg>
          </div>
        </section>

        <section className="authority-panel urgent-panel">
          <div className="authority-panel-heading"><div><h2>Urgent Issues</h2><p>Pending reports requiring attention</p></div><span className="urgent-count">{pendingCount}</span></div>
          {authorityLoading ? <p className="authority-empty">Loading complaints…</p> : urgentComplaints.length === 0 ? (
            <p className="authority-empty">No pending issues need attention.</p>
          ) : (
            <div className="urgent-list">
              {urgentComplaints.map((complaint) => (
                <article className="urgent-item" key={complaint.id}>
                  <span className="urgent-icon">{categoryIcons[complaint.category] || '!'}</span>
                  <div className="urgent-copy"><strong>{complaint.title || 'Untitled complaint'}</strong><span>{complaint.location || 'Location not specified'} · {formatComplaintDate(complaint.createdAt)}</span></div>
                  <button type="button" onClick={() => openAuthorityComplaint(complaint)}>View <span>→</span></button>
                </article>
              ))}
            </div>
          )}
        </section>
      </AuthorityPortal>
    )
  }

  if (currentPage === 'authority-queue') {
    const searchTerm = authoritySearch.trim().toLowerCase()
    const filteredAuthorityComplaints = authorityComplaints.filter((complaint) => {
      const matchesStatus = authorityFilter === 'All' || (complaint.status || 'Pending') === authorityFilter
      const matchesSearch = !searchTerm
        || (complaint.id || '').toLowerCase().includes(searchTerm)
        || (complaint.title || '').toLowerCase().includes(searchTerm)
        || (complaint.location || '').toLowerCase().includes(searchTerm)
      return matchesStatus && matchesSearch
    })

    return (
      <AuthorityPortal currentPage={currentPage} setCurrentPage={setCurrentPage} onLogout={handleAuthorityLogout}>
        <header className="operations-heading queue-heading">
          <div><span className="authority-eyebrow">ALL CAMPUS REPORTS</span><h1>Complaint Queue</h1><p>{authorityComplaints.length} reports · Review and assign work</p></div>
          <button type="button" className="refresh-icon-button" aria-label="Refresh complaints" onClick={handleLoadAuthorityComplaints} disabled={authorityLoading}>{authorityLoading ? '…' : '↻'}</button>
        </header>
        <label className="authority-search"><span>⌕</span><input type="search" value={authoritySearch} onChange={(event) => setAuthoritySearch(event.target.value)} placeholder="Search by ID, title, or location..." aria-label="Search by ID, title, or location" /></label>
        <div className="authority-filter-pills" role="tablist" aria-label="Filter queue by status">
          {['All', 'Pending', 'In Progress', 'Resolved'].map((filter) => <button type="button" role="tab" aria-selected={authorityFilter === filter} className={authorityFilter === filter ? 'selected' : ''} key={filter} onClick={() => setAuthorityFilter(filter)}>{filter}</button>)}
        </div>
        <section className="authority-panel queue-panel">
          <div className="queue-list-heading"><span>REPORT</span><span>STATUS</span></div>
          {authorityLoading ? <p className="authority-empty">Loading campus complaints…</p> : filteredAuthorityComplaints.length === 0 ? (
            <p className="authority-empty">No complaints match your search or filter.</p>
          ) : (
            <div className="authority-queue-list">
              {filteredAuthorityComplaints.map((complaint) => (
                <button type="button" className="authority-queue-item" key={complaint.id} onClick={() => openAuthorityComplaint(complaint)}>
                  <span className="queue-category-icon">{categoryIcons[complaint.category] || '⌁'}</span>
                  <span className="queue-item-copy">
                    <strong>{complaint.title || 'Untitled complaint'}</strong>
                    <small>#{complaint.id} · {complaint.category || 'Other'}</small>
                    <span>{complaint.location || 'Location not specified'}{complaint.photoUrl && <em>▧ Photo</em>}</span>
                  </span>
                  <span className={`complaint-status ${(complaint.status || 'Pending').toLowerCase().replace(/\s+/g, '-')}`}>{complaint.status || 'Pending'}</span>
                </button>
              ))}
            </div>
          )}
        </section>
      </AuthorityPortal>
    )
  }

  if (currentPage === 'authority-update') {
    const authorityComplaint = selectedAuthorityComplaint
      ? authorityComplaints.find((complaint) => complaint.id === selectedAuthorityComplaint.id) || selectedAuthorityComplaint
      : null

    if (!authorityComplaint) {
      return (
        <AuthorityPortal currentPage={currentPage} setCurrentPage={setCurrentPage} onLogout={handleAuthorityLogout}>
          <p className="authority-empty">Select a complaint from the queue to view its details.</p>
          <button type="button" className="authority-primary-button" onClick={() => setCurrentPage('authority-queue')}>Open Complaint Queue</button>
        </AuthorityPortal>
      )
    }

    return (
      <AuthorityPortal currentPage={currentPage} setCurrentPage={setCurrentPage} onLogout={handleAuthorityLogout}>
        <button type="button" className="authority-back-button" onClick={() => setCurrentPage('authority-queue')}>← Back to Queue</button>
        <header className="operations-heading update-heading"><div><span className="authority-eyebrow">COMPLAINT ASSIGNMENT</span><h1>Review & Update</h1><p>#{authorityComplaint.id}</p></div><span className={`complaint-status ${(authorityComplaint.status || 'Pending').toLowerCase().replace(/\s+/g, '-')}`}>{authorityComplaint.status || 'Pending'}</span></header>
        <article className="authority-panel update-detail-card">
          {authorityComplaint.photoUrl && <a className="authority-photo-link" href={authorityComplaint.photoUrl} target="_blank" rel="noreferrer"><img src={authorityComplaint.photoUrl} alt="Attached complaint evidence" /></a>}
          <div className="update-complaint-meta"><span>{categoryIcons[authorityComplaint.category] || '⌁'} {authorityComplaint.category || 'Other'}</span><span>◷ {formatComplaintDate(authorityComplaint.createdAt, true)}</span></div>
          <h2>{authorityComplaint.title || 'Untitled complaint'}</h2>
          <p className="update-location">⌖ {authorityComplaint.location || 'Location not specified'}</p>
          <p className="update-description">{authorityComplaint.description || 'No description provided.'}</p>
          <dl className="update-report-id"><dt>REPORT ID</dt><dd>{authorityComplaint.id}</dd></dl>
        </article>
        <section className="authority-panel assignment-panel">
          <div className="authority-panel-heading"><div><h2>Assignment & Status</h2><p>Coordinate a response for this issue.</p></div></div>
          <label>Assign Department
            <select value={authorityDepartment} onChange={(event) => setAuthorityDepartment(event.target.value)}>
              {authorityDivisions.map((department) => <option key={department}>{department}</option>)}
            </select>
          </label>
          <label>Status
            <select value={authorityUpdateStatus} onChange={(event) => setAuthorityUpdateStatus(event.target.value)}>
              {['Pending', 'In Progress', 'Resolved'].map((status) => <option key={status}>{status}</option>)}
            </select>
          </label>
          <label>Add Internal Note (optional)
            <textarea value={authorityInternalNote} onChange={(event) => setAuthorityInternalNote(event.target.value)} rows="4" placeholder="Add context for the operations team…" />
          </label>
          <button type="button" className="authority-primary-button" onClick={() => handleUpdateComplaintStatus(authorityComplaint.id, authorityUpdateStatus)}>Update Status</button>
          <p className="internal-note-hint">Department assignment and internal notes are for this session only.</p>
        </section>
      </AuthorityPortal>
    )
  }

  if (currentPage === 'authority-analytics') {
    const now = new Date()
    const periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    if (authorityAnalyticsPeriod === 'This Week') {
      periodStart.setDate(periodStart.getDate() - ((periodStart.getDay() + 6) % 7))
    } else if (authorityAnalyticsPeriod === 'This Month') {
      periodStart.setDate(1)
    } else {
      periodStart.setMonth(0, 1)
    }
    const periodComplaints = authorityComplaints.filter((complaint) => {
      const reportedAt = complaint.createdAt?.toDate?.()
      return !reportedAt || (reportedAt >= periodStart && reportedAt <= now)
    })
    const totalPeriodComplaints = periodComplaints.length
    const periodResolvedCount = periodComplaints.filter((complaint) => complaint.status === 'Resolved').length
    const periodPendingCount = periodComplaints.filter((complaint) => (complaint.status || 'Pending') === 'Pending').length
    const periodProgressCount = periodComplaints.filter((complaint) => complaint.status === 'In Progress').length
    const resolvedRate = totalPeriodComplaints ? Math.round((periodResolvedCount / totalPeriodComplaints) * 100) : 0
    const donutCircumference = 2 * Math.PI * 43
    const locationCounts = periodComplaints.reduce((counts, complaint) => {
      const location = complaint.location?.trim() || 'Unspecified'
      counts[location] = (counts[location] || 0) + 1
      return counts
    }, {})
    const topLocations = Object.entries(locationCounts)
      .sort(([, countA], [, countB]) => countB - countA)
      .slice(0, 5)
    const maxLocationCount = Math.max(1, ...topLocations.map(([, count]) => count))

    return (
      <AuthorityPortal currentPage={currentPage} setCurrentPage={setCurrentPage} onLogout={handleAuthorityLogout}>
        <header className="operations-heading analytics-heading"><div><span className="authority-eyebrow">PERFORMANCE REPORTS</span><h1>Analytics & Reports</h1><p>Campus issue resolution at a glance.</p></div></header>
        <div className="analytics-period-pills" role="tablist" aria-label="Analytics reporting period">
          {['This Week', 'This Month', 'This Year'].map((period) => <button type="button" role="tab" aria-selected={authorityAnalyticsPeriod === period} className={authorityAnalyticsPeriod === period ? 'selected' : ''} key={period} onClick={() => setAuthorityAnalyticsPeriod(period)}>{period}</button>)}
        </div>
        <section className="authority-panel analytics-donut-panel">
          <div className="authority-panel-heading"><div><h2>Resolution Rate</h2><p>{authorityAnalyticsPeriod} · Complaint outcomes</p></div><span className="analytics-total">{totalPeriodComplaints} total</span></div>
          <div className="analytics-donut-layout">
            <div className="donut-chart">
              <svg viewBox="0 0 110 110" role="img" aria-label={`${resolvedRate}% of complaints resolved`}>
                <circle cx="55" cy="55" r="43" className="donut-track" />
                <circle cx="55" cy="55" r="43" className="donut-resolved" strokeDasharray={donutCircumference} strokeDashoffset={donutCircumference * (1 - resolvedRate / 100)} />
              </svg>
              <div><strong>{resolvedRate}%</strong><span>Resolved</span></div>
            </div>
            <div className="donut-legend">
              <div><i className="legend-resolved" /><span>Resolved</span><strong>{periodResolvedCount}</strong></div>
              <div><i className="legend-pending" /><span>Pending</span><strong>{periodPendingCount}</strong></div>
              <div><i className="legend-progress" /><span>In Progress</span><strong>{periodProgressCount}</strong></div>
            </div>
          </div>
        </section>
        <section className="authority-panel top-locations-panel">
          <div className="authority-panel-heading"><div><h2>Top Locations</h2><p>Reports by campus location</p></div><span className="location-period-label">{authorityAnalyticsPeriod}</span></div>
          {topLocations.length === 0 ? <p className="authority-empty">No location reports for this period.</p> : (
            <div className="location-bars">
              {topLocations.map(([location, count], index) => (
                <div className="location-bar-row" key={location}>
                  <div className="location-bar-label"><span><i>{index + 1}</i>{location}</span><strong>{count}</strong></div>
                  <div className="location-bar-track"><span style={{ width: `${(count / maxLocationCount) * 100}%` }} /></div>
                </div>
              ))}
            </div>
          )}
        </section>
      </AuthorityPortal>
    )
  }

  // REGISTRATION PAGE
  if (currentPage === 'register') {
    const continueRegistration = () => {
      const stepForm = document.getElementById('register-step-one')
      if (stepForm?.reportValidity()) setRegisterStep(2)
    }

    return (
      <main className="register-screen">
        <div className="register-card wizard-card">
          <h1>Create Account</h1>
          <p>Join CampusFix and help improve your campus.</p>

          <div className="wizard-stepper" aria-label="Registration progress">
            <div className={`step-indicator ${registerStep === 1 ? 'current' : 'complete'}`}><span>1</span><strong>Personal Details</strong></div>
            <div className={`step-indicator ${registerStep === 2 ? 'current' : ''}`}><span>2</span><strong>Account Setup</strong></div>
          </div>

          <form id="register-step-one" className="register-form" onSubmit={handleRegister}>
            {registerStep === 1 ? (
              <div className="step-form">
                <label htmlFor="firstName">First Name</label>
                <input id="firstName" type="text" name="firstName" value={formData.firstName} onChange={handleChange} placeholder="Enter first name" required />
                <label htmlFor="lastName">Last Name</label>
                <input id="lastName" type="text" name="lastName" value={formData.lastName} onChange={handleChange} placeholder="Enter last name" required />
                <label htmlFor="prNumber">PR Number</label>
                <input id="prNumber" type="text" name="prNumber" value={formData.prNumber} onChange={handleChange} placeholder="Enter PR number" required />
                <label htmlFor="department">Department</label>
                <select id="department" name="department" value={formData.department} onChange={handleChange} required>
                  <option value="">Select department</option>
                  {departments.map((department) => <option key={department} value={department}>{department}</option>)}
                </select>
                <label htmlFor="course">Course</label>
                <select id="course" name="course" value={formData.course} onChange={handleChange} required>
                  <option value="">Select course</option>
                  {courses.map((course) => <option key={course} value={course}>{course}</option>)}
                </select>
                <span className="form-field-label">I am a</span>
                <div className="role-pills">
                  <label className={formData.role === 'student' ? 'selected' : ''}>
                    <input type="radio" name="role" value="student" checked={formData.role === 'student'} onChange={handleChange} /> Student
                  </label>
                  <label className={formData.role === 'faculty' ? 'selected' : ''}>
                    <input type="radio" name="role" value="faculty" checked={formData.role === 'faculty'} onChange={handleChange} /> Faculty
                  </label>
                </div>
                <button type="button" className="register-button" onClick={continueRegistration}>Continue to Account Setup</button>
              </div>
            ) : (
              <div className="step-form">
                <label htmlFor="phone">Phone Number</label>
                <input id="phone" type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="Enter phone number" required />
                <label htmlFor="register-email">College Email ID</label>
                <input id="register-email" type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Enter college email" required />
                <label htmlFor="register-password">Password</label>
                <input id="register-password" type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Create password" required />
                <label htmlFor="confirm-password">Confirm Password</label>
                <input id="confirm-password" type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="Confirm password" required />
                <button type="submit" className="register-button">Create Account</button>
                <button type="button" className="wizard-back" onClick={() => setRegisterStep(1)}>Back to Personal Details</button>
              </div>
            )}
          </form>

          <button
            type="button"
            onClick={() => { setRegisterStep(1); setCurrentPage('access-choice') }}
          >
            Back
          </button>
        </div>
      </main>
    )
  }

  // REPORT COMPLAINT PAGE
  if (currentPage === 'complaint') {
    const continueComplaint = () => {
      if (complaintStep === 1 && !complaintData.category) {
        alert('Please select an issue category.')
        return
      }
      if (complaintStep === 2 && !complaintBuilding) {
        alert('Please select a building or block.')
        return
      }
      setComplaintStep((step) => Math.min(step + 1, 3))
    }

    const categories = [
      ['Electrical', '⚡'],
      ['Plumbing', '💧'],
      ['Cleanliness', '✨'],
      ['Furniture', '🪑'],
      ['Internet', '📶'],
      ['Other', '•••']
    ]

    return (
      <main className="register-screen">
        <div className="register-card wizard-card">
          <button type="button" className="back-link" onClick={() => setCurrentPage('dashboard')}>← Home</button>
          <h1>Report an Issue</h1>
          <p>Help us make your campus better.</p>
          <div className="wizard-stepper" aria-label="Report progress">
            {['Issue', 'Location', 'Details'].map((label, index) => (
              <div key={label} className={`step-indicator ${complaintStep === index + 1 ? 'current' : complaintStep > index + 1 ? 'complete' : ''}`}>
                <span>{index + 1}</span><strong>{label}</strong>
              </div>
            ))}
          </div>

          <form className="register-form" onSubmit={handleSubmitComplaint}>
            {complaintStep === 1 && (
              <section className="step-form">
                <span className="form-field-label">What needs attention?</span>
                <div className="category-grid">
                  {categories.map(([category, icon]) => (
                    <button type="button" key={category} className={`category-option ${complaintData.category === category ? 'selected' : ''}`} onClick={() => setComplaintData((previous) => ({ ...previous, category }))}>
                      <span>{icon}</span>{category}
                    </button>
                  ))}
                </div>
                <button type="button" className="register-button" onClick={continueComplaint}>Choose Location</button>
              </section>
            )}
            {complaintStep === 2 && (
              <section className="step-form">
                <label htmlFor="complaint-building">Building / Block</label>
                <select id="complaint-building" value={complaintBuilding} onChange={(event) => setComplaintBuilding(event.target.value)} required>
                  <option value="">Select a building or block</option>
                  {buildings.map(({ label, value }) => <option key={value} value={value}>{label}</option>)}
                </select>
                <label htmlFor="complaint-spot">Room / Floor / Specific Spot</label>
                <input id="complaint-spot" type="text" value={complaintSpot} onChange={(event) => setComplaintSpot(event.target.value)} placeholder="e.g. Lab 2, second floor" />
                <button type="button" className="register-button" onClick={continueComplaint}>Add Details</button>
                <button type="button" className="wizard-back" onClick={() => setComplaintStep(1)}>Back to Issue</button>
              </section>
            )}
            {complaintStep === 3 && (
              <section className="step-form">
                <label htmlFor="complaint-title">Complaint Title</label>
                <input id="complaint-title" type="text" name="title" value={complaintData.title} onChange={handleComplaintChange} placeholder="Give the issue a short title" required />
                <label htmlFor="complaint-description">Description</label>
                <textarea id="complaint-description" name="description" value={complaintData.description} onChange={handleComplaintChange} placeholder="Describe what happened and where..." rows="4" required />
                <label htmlFor="complaint-gallery-input">Photo Evidence <span className="optional-label">Optional · up to 5 MB</span></label>
                <input id="complaint-gallery-input" className="photo-input" type="file" accept="image/*" onChange={handlePhotoChange} />
                <label htmlFor="complaint-gallery-input" className="photo-picker">＋ Choose a photo</label>
                {photoPreview && (
                  <div className="photo-preview">
                    <img src={photoPreview} alt="Selected complaint evidence preview" />
                    <button type="button" onClick={handleRemovePhoto}>Remove photo</button>
                  </div>
                )}
                <button type="submit" className="register-button" disabled={photoUploading}>
                  {photoUploading ? 'Uploading Photo...' : 'Submit Complaint'}
                </button>
                <button type="button" className="wizard-back" onClick={() => setComplaintStep(2)}>Back to Location</button>
              </section>
            )}
          </form>
        </div>
        <BottomNavigation currentPage={currentPage} setCurrentPage={setCurrentPage} onViewMyComplaints={handleViewMyComplaints} />
      </main>
    )
  }

  // MY COMPLAINTS TRACKING PAGE
  if (currentPage === 'my-complaints') {
    const filteredComplaints = myComplaints.filter((complaint) => {
      const status = complaint.status || 'Pending'
      const matchesStatus = complaintFilter === 'All' || status === complaintFilter
      const searchTerm = complaintSearch.trim().toLowerCase()
      const matchesSearch = !searchTerm
        || (complaint.title || '').toLowerCase().includes(searchTerm)
        || (complaint.location || '').toLowerCase().includes(searchTerm)
      return matchesStatus && matchesSearch
    })

    return (
      <main className="app-screen screen-with-nav">
        <header className="screen-titlebar">
          <button type="button" className="titlebar-back" aria-label="Back to home" onClick={() => setCurrentPage('dashboard')}>←</button>
          <h1>My Complaints</h1>
          <span className="titlebar-spacer" />
        </header>

        <div className="filter-pills" role="tablist" aria-label="Filter complaints by status">
          {['All', 'Pending', 'In Progress', 'Resolved'].map((filter) => (
            <button type="button" role="tab" aria-selected={complaintFilter === filter} className={complaintFilter === filter ? 'selected' : ''} key={filter} onClick={() => setComplaintFilter(filter)}>{filter}</button>
          ))}
        </div>

        <label className="search-control">
          <span aria-hidden="true">⌕</span>
          <input type="search" value={complaintSearch} onChange={(event) => setComplaintSearch(event.target.value)} placeholder="Search by title or location..." aria-label="Search by title or location" />
        </label>

        {complaintsLoading ? (
          <p className="empty-state">Loading your complaints...</p>
        ) : myComplaints.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">▤</span>
            <h2>No complaints yet</h2>
            <p>Your reported campus issues will appear here.</p>
          </div>
        ) : filteredComplaints.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">⌕</span>
            <h2>No matching complaints</h2>
            <p>Try another search or status filter.</p>
          </div>
        ) : (
          <div className="complaints-list">
            {filteredComplaints.map((complaint) => (
              <button className="complaint-item complaint-list-card" key={complaint.id} onClick={() => { setSelectedComplaint(complaint); setCurrentPage('complaint-details') }}>
                <span className="issue-icon">{categoryIcons[complaint.category] || categoryIcons.Other}</span>
                <span className="issue-card-content">
                  <strong>{complaint.title || 'Untitled complaint'}</strong>
                  <span>{complaint.location || 'Location unavailable'} · {formatComplaintDate(complaint.createdAt)}</span>
                </span>
                <span className={`complaint-status ${(complaint.status || 'Pending').toLowerCase().replace(/\s+/g, '-')}`}>{complaint.status || 'Pending'}</span>
              </button>
            ))}
          </div>
        )}

        <BottomNavigation currentPage={currentPage} setCurrentPage={setCurrentPage} onViewMyComplaints={handleViewMyComplaints} />
      </main>
    )
  }

  // STUDENT / FACULTY DASHBOARD
  if (currentPage === 'dashboard') {
    const pendingCount = myComplaints.filter((item) => (item.status || 'Pending') === 'Pending').length
    const progressCount = myComplaints.filter((item) => item.status === 'In Progress').length
    const resolvedCount = myComplaints.filter((item) => item.status === 'Resolved').length
    const initials = `${userData?.firstName?.[0] || 'S'}${userData?.lastName?.[0] || ''}`.toUpperCase()

    return (
      <main className="app-screen screen-with-nav dashboard-screen">
        <header className="dashboard-topbar">
          <div className="user-greeting">
            <span className="avatar">{initials}</span>
            <div><p>Good Morning,</p><h1>{userData?.firstName || 'Student'}</h1></div>
          </div>
          <button className="icon-button notification-button" aria-label="Notifications" onClick={() => setCurrentPage('notifications')}>🔔<span /></button>
        </header>

        <section className="hero-card">
          <div className="hero-copy">
            <span className="hero-kicker">CAMPUSFIX</span>
            <h2>Something broken?<br />Report it now!</h2>
            <button type="button" onClick={() => { setComplaintStep(1); setCurrentPage('complaint') }}>＋ Report an Issue</button>
          </div>
          <span className="hero-wrench" aria-hidden="true">🔧</span>
        </section>

        <section className="summary-section" aria-label="Complaint status summary">
          <div className="summary-card pending-summary"><strong>{pendingCount}</strong><span>Pending</span></div>
          <div className="summary-card progress-summary"><strong>{progressCount}</strong><span>In Progress</span></div>
          <div className="summary-card resolved-summary"><strong>{resolvedCount}</strong><span>Resolved</span></div>
        </section>

        <section className="recent-section">
          <div className="section-heading">
            <div><span className="eyebrow">STAY IN THE LOOP</span><h2>Recent Complaints</h2></div>
            <button type="button" onClick={handleViewMyComplaints}>View All <span>→</span></button>
          </div>
          {complaintsLoading ? (
            <p className="empty-state compact">Loading your recent reports...</p>
          ) : myComplaints.length === 0 ? (
            <div className="empty-state compact"><p>No complaints yet. Report an issue to get started.</p></div>
          ) : (
            <div className="recent-list">
              {myComplaints.slice(0, 3).map((complaint) => (
                <button className="complaint-item issue-card" key={complaint.id} onClick={() => { setSelectedComplaint(complaint); setCurrentPage('complaint-details') }}>
                  <span className="issue-icon">⌁</span>
                  <span className="issue-card-content">
                    <strong>{complaint.title || 'Untitled complaint'}</strong>
                    <span>{complaint.category || 'Issue'} · {complaint.location || 'Location unavailable'}</span>
                  </span>
                  <span className={`complaint-status ${(complaint.status || 'Pending').toLowerCase().replace(/\s+/g, '-')}`}>{complaint.status || 'Pending'}</span>
                </button>
              ))}
            </div>
          )}
        </section>
        <BottomNavigation currentPage={currentPage} setCurrentPage={setCurrentPage} onViewMyComplaints={handleViewMyComplaints} />
      </main>
    )
  }

  if (currentPage === 'submission-success') {
    return (
      <main className="app-screen screen-with-nav success-screen">
        <div className="success-content">
          <div className="success-check">✓</div>
          <span className="eyebrow">THANK YOU FOR SPEAKING UP</span>
          <h1>Report Submitted!</h1>
          <p>Your complaint has been added to the CampusFix queue.</p>
          <div className="submitted-card">
            <span>COMPLAINT ID</span>
            <strong>{lastSubmittedId || 'Unavailable'}</strong>
            <div><span className="status-dot" /> Status: Pending</div>
          </div>
          <button className="btn-primary" onClick={handleViewMyComplaints}>Track Complaint</button>
          <button className="secondary-button" onClick={() => setCurrentPage('dashboard')}>Back to Home</button>
        </div>
        <BottomNavigation currentPage={currentPage} setCurrentPage={setCurrentPage} onViewMyComplaints={handleViewMyComplaints} />
      </main>
    )
  }

  if (currentPage === 'complaint-details') {
    const complaintStatus = selectedComplaint?.status || 'Pending'
    const completedJourneySteps = complaintStatus === 'Resolved'
      ? 4
      : complaintStatus === 'In Progress'
        ? 2
        : 1
    const activeJourneyStep = complaintStatus === 'Resolved'
      ? -1
      : complaintStatus === 'In Progress'
        ? 2
        : 1
    const journeySteps = ['Complaint Submitted', 'Under Review', 'In Progress', 'Resolved']

    return (
      <main className="app-screen screen-with-nav">
        <header className="screen-titlebar">
          <button type="button" className="titlebar-back" aria-label="Back to complaints" onClick={() => setCurrentPage('my-complaints')}>←</button>
          <h1>Complaint Details</h1>
          <span className="titlebar-spacer" />
        </header>
        {selectedComplaint ? (
          <>
            <div className={`detail-banner ${selectedComplaint.photoUrl ? 'has-photo' : ''}`}>
              {selectedComplaint.photoUrl
                ? <img src={selectedComplaint.photoUrl} alt={`${selectedComplaint.category || 'Campus'} complaint`} />
                : <div className="category-banner"><span>{categoryIcons[selectedComplaint.category] || categoryIcons.Other}</span><strong>{selectedComplaint.category || 'Campus issue'}</strong></div>}
            </div>
            <article className="detail-card">
              <div className="detail-id-row">
                <span>#{(selectedComplaint.id || '').slice(0, 8).toUpperCase()}</span>
                <span className={`complaint-status ${complaintStatus.toLowerCase().replace(/\s+/g, '-')}`}>{complaintStatus}</span>
              </div>
              <h2>{selectedComplaint.title || 'Untitled complaint'}</h2>
              <div className="detail-facts">
                <div><span className="fact-icon">⌖</span><span><small>LOCATION</small><strong>{selectedComplaint.location || 'Not specified'}</strong></span></div>
                <div><span className="fact-icon">{categoryIcons[selectedComplaint.category] || categoryIcons.Other}</span><span><small>CATEGORY</small><strong>{selectedComplaint.category || 'Other'}</strong></span></div>
                <div><span className="fact-icon">◷</span><span><small>REPORTED</small><strong>{formatComplaintDate(selectedComplaint.createdAt, true)}</strong></span></div>
              </div>
              <section className="description-section">
                <h3>Description</h3>
                <p>{selectedComplaint.description || 'No description provided.'}</p>
              </section>
            </article>
            <section className="journey-card">
              <h2>Fix Journey</h2>
              <div className="journey-timeline">
                {journeySteps.map((step, index) => {
                  const complete = index < completedJourneySteps
                  const active = index === activeJourneyStep
                  return (
                    <div className={`journey-step ${complete ? 'complete' : ''} ${active ? 'active' : ''}`} key={step}>
                      <span className="journey-marker">{complete ? '✓' : index + 1}</span>
                      <span className="journey-label">{step}</span>
                      {active && <small>{complaintStatus === 'Pending' ? 'UNDER REVIEW' : 'IN PROGRESS'}</small>}
                    </div>
                  )
                })}
              </div>
            </section>
          </>
        ) : <p className="empty-state">Complaint details are unavailable.</p>}
        <BottomNavigation currentPage={currentPage} setCurrentPage={setCurrentPage} onViewMyComplaints={handleViewMyComplaints} />
      </main>
    )
  }

  if (currentPage === 'profile') {
    const initials = `${userData?.firstName?.[0] || 'S'}${userData?.lastName?.[0] || ''}`.toUpperCase()
    const openSettingsDialog = (title, message) => setSettingsDialog({ title, message })

    return (
      <main className="app-screen screen-with-nav">
        <div className="page-heading"><span className="eyebrow">YOUR ACCOUNT</span><h1>Profile & Settings</h1><p>Manage your CampusFix account and preferences.</p></div>
        <section className="profile-header-card">
          <span className="avatar profile-avatar">{initials}</span>
          <h2>{userData?.name || userData?.firstName || 'Student'}</h2>
          <p>{userData?.email || auth.currentUser?.email || ''}</p>
          <span className="profile-pr">PR: {userData?.prNumber || 'N/A'}</span>
          <div className="profile-pills">
            <span>{userData?.department || 'Department not set'}</span>
            <span>{userData?.course || 'Course not set'}</span>
          </div>
        </section>
        <section className="settings-card" aria-label="Profile settings">
          <button className="settings-row" onClick={() => openSettingsDialog('Edit Profile', 'Profile changes are managed through your campus account. Contact your department administrator to update your details.')}>
            <span className="settings-icon">♙</span><span><strong>Edit Profile</strong><small>Update your personal information</small></span><b>›</b>
          </button>
          <button className="settings-row" onClick={() => setCurrentPage('notifications')}>
            <span className="settings-icon">♧</span><span><strong>Notifications</strong><small>View complaint and campus updates</small></span><b>›</b>
          </button>
          <button className="settings-row" onClick={() => openSettingsDialog('Appearance', 'CampusFix is using the light appearance, optimized for clear reading around campus.')}>
            <span className="settings-icon">◐</span><span><strong>Appearance</strong><small>Light theme</small></span><b>›</b>
          </button>
          <button className="settings-row" onClick={() => openSettingsDialog('Help & Support', 'For help with your campus report, contact your department office or campus facilities team.')}>
            <span className="settings-icon">?</span><span><strong>Help & Support</strong><small>Get assistance with CampusFix</small></span><b>›</b>
          </button>
          <button className="settings-row" onClick={() => openSettingsDialog('About CampusFix', 'CampusFix helps students and faculty report, track, and resolve campus issues.')}>
            <span className="settings-icon">i</span><span><strong>About CampusFix</strong><small>Report. Track. Resolve.</small></span><b>›</b>
          </button>
        </section>
        <button className="logout-button" onClick={async () => { await signOut(auth); setUserData(null); setMyComplaints([]); setCurrentPage('welcome') }}>Logout</button>
        {settingsDialog && (
          <div className="modal-backdrop" onClick={() => setSettingsDialog(null)}>
            <section className="settings-modal" role="dialog" aria-modal="true" aria-labelledby="settings-modal-title" onClick={(event) => event.stopPropagation()}>
              <span className="modal-mark">CF</span>
              <h2 id="settings-modal-title">{settingsDialog.title}</h2>
              <p>{settingsDialog.message}</p>
              <button type="button" className="btn-primary" onClick={() => setSettingsDialog(null)}>Done</button>
            </section>
          </div>
        )}
        <BottomNavigation currentPage={currentPage} setCurrentPage={setCurrentPage} onViewMyComplaints={handleViewMyComplaints} />
      </main>
    )
  }

  if (currentPage === 'notifications') {
    const campusAnnouncements = [
      { id: 'campus-update-1', type: 'Updates', title: 'Campus facilities update', message: 'Facilities teams are reviewing reports across campus today.', date: 'Campus announcement' },
      { id: 'campus-update-2', type: 'Updates', title: 'Help keep campus accessible', message: 'Include a precise location when reporting an issue so teams can respond faster.', date: 'Campus announcement' }
    ]
    const complaintNotifications = myComplaints.map((complaint) => {
      const status = complaint.status || 'Pending'
      const statusMessages = {
        Pending: 'Your report is awaiting review.',
        'In Progress': 'The facilities team is working on your report.',
        Resolved: 'Your reported issue has been resolved.'
      }
      return {
        id: complaint.id,
        type: 'Complaints',
        title: complaint.title || 'Complaint status update',
        message: statusMessages[status] || `Your report status is ${status}.`,
        date: formatComplaintDate(complaint.createdAt),
        status,
        complaint
      }
    })
    const allNotifications = [...complaintNotifications, ...campusAnnouncements]
    const visibleNotifications = notificationFilter === 'All'
      ? allNotifications
      : allNotifications.filter((notification) => notification.type === notificationFilter)

    return (
      <main className="app-screen screen-with-nav">
        <header className="screen-titlebar">
          <button type="button" className="titlebar-back" aria-label="Back to home" onClick={() => setCurrentPage('dashboard')}>←</button>
          <h1>Notifications</h1>
          <span className="titlebar-spacer" />
        </header>
        <div className="notifications-toolbar">
          <div className="filter-pills notification-tabs" role="tablist" aria-label="Filter notifications">
            {['All', 'Complaints', 'Updates'].map((filter) => (
              <button type="button" role="tab" aria-selected={notificationFilter === filter} className={notificationFilter === filter ? 'selected' : ''} key={filter} onClick={() => setNotificationFilter(filter)}>{filter}</button>
            ))}
          </div>
          <button type="button" className="mark-read-button" onClick={() => setNotificationsRead(true)} disabled={notificationsRead}>
            {notificationsRead ? 'All caught up' : 'Mark all as read'}
          </button>
        </div>
        <div className="notification-list">
          {visibleNotifications.map((notification) => {
            const content = (
              <>
                <span className={`notification-icon ${notification.type === 'Complaints' ? 'complaint-notification-icon' : ''}`}>{notification.type === 'Complaints' ? categoryIcons[notification.complaint.category] || categoryIcons.Other : '⌂'}</span>
                <span className="notification-copy">
                  <strong>{notification.title}</strong>
                  <span>{notification.message}</span>
                  <small>{notification.date}</small>
                </span>
                {notification.status && <span className={`complaint-status ${notification.status.toLowerCase().replace(/\s+/g, '-')}`}>{notification.status}</span>}
                {!notificationsRead && <span className="unread-dot" aria-label="Unread" />}
              </>
            )
            return notification.complaint ? (
              <button type="button" className="notification-card" key={notification.id} onClick={() => { setSelectedComplaint(notification.complaint); setCurrentPage('complaint-details') }}>{content}</button>
            ) : (
              <article className="notification-card" key={notification.id}>{content}</article>
            )
          })}
        </div>
        <BottomNavigation currentPage={currentPage} setCurrentPage={setCurrentPage} onViewMyComplaints={handleViewMyComplaints} />
      </main>
    )
  }

  // WELCOME PAGE (Mobile UI)
  return (
    <main className="app-screen" style={{ padding: 0, background: '#f5f8fc' }}>
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