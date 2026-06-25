import { BrowserRouter,Route,Routes,Navigate } from 'react-router-dom'
import { useAuthContext } from './context/AuthContext'
import AppLayout from './components/layout/AppLayout'
import AuthLayout from './components/layout/AuthLayout'
import LandingPageLayout from './components/layout/LandingPagesLayout'
import LandingLayout from './components/layout/LandingLayout'
import ProtectedRoute from './components/layout/ProtectedRoute'
import GuestRoute from './components/layout/GuestRoute'
import BookPage from './pages/BookPage'
import DashBoard from './pages/DashboardPage'
import BestsellersPage from './pages/BestsellersPage'
import Landing from './pages/LandingPage';
import Login from './pages/LoginPage';
import Register from './pages/RegisterPage';
import VerifyEmail from './pages/VerifyEmailPage';
import EditorsPicksPage from './pages/EditorsPicksPage'
import ForgotPassword from './pages/ForgotPasswordPage';
import ResetPassword from './pages/ResetPasswordPage';
import OAuthCallback from './pages/OAuthCallback';
import GenrePage from './pages/GenrePage'
import Home from './pages/HomePage';
import Search from './pages/SearchPage';
import Review from './pages/ReviewPage';
import Profile from './pages/ProfilePage';
import Settings from './pages/SettingsPage';
import Shelves from './pages/ShelvesPage';
import Notifications from './pages/NotificationsPage';
import MessagesLayout from './pages/MessagesLayout';
import OnboardingRoute from './components/layout/OnboardinRoute'
import ClubPage from './pages/ClubPage'
import ClubsPage from './pages/ClubsPage'
import ClubSettingsPage from './pages/ClubSettingsPage'
import CreateClubPage from './pages/CreateClubPage'
import ClubActivityPage from './pages/ClubActivityPage'

 const SmartLayout = () => {
  const { isAuthenticated } = useAuthContext();
  return isAuthenticated ? <AppLayout /> : <LandingPageLayout />;
};

function App() {
  return (
    <>
      <BrowserRouter>
      <Routes>
        <Route element={<LandingLayout />}>
          <Route path='/' element={<Landing />} />
        </Route>

        
        <Route element={<AuthLayout />}>
          <Route path='/login' element={<GuestRoute><Login /></GuestRoute>} />
          <Route path='/register' element={<GuestRoute><Register /></GuestRoute>} />
          <Route path='/verify-email' element={<GuestRoute><VerifyEmail /></GuestRoute>} />
          <Route path='/forgot-password' element={<GuestRoute><ForgotPassword /></GuestRoute>} />
          <Route path='/reset-password' element={<GuestRoute><ResetPassword /></GuestRoute>} />
        </Route>


        <Route path="/onboarding" element={
          <OnboardingRoute>
            <Settings isOnboarding={true} />
          </OnboardingRoute>
        } />

        <Route element={<SmartLayout />}>
            <Route path='/genres/:genreName' element={<GenrePage />} />
            <Route path='/books/:bookId' element={<BookPage />} />
            <Route path='/search' element={<Search />} />
            <Route path="/clubs">
              <Route index element={<ClubsPage />} />
              <Route path=":clubId" element={<ClubPage />} /> 
            </Route>
           <Route path='/editors-picks' element={<EditorsPicksPage/>} />
            <Route path='/bestsellers' element={<BestsellersPage/>} />
        </Route>
        
        <Route element={<AppLayout />}>
          <Route path='/home' element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path='/reviews/:reviewId' element={<ProtectedRoute><Review /></ProtectedRoute>} />
          <Route path='/profile' element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path='/profile/:userId' element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path='/settings' element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path='/dashboard' element={<ProtectedRoute><DashBoard /></ProtectedRoute>} />
          <Route path='/shelves' element={<ProtectedRoute><Shelves /></ProtectedRoute>} />
          <Route path='/notifications' element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
          <Route path='/messages' element={<ProtectedRoute><MessagesLayout/></ProtectedRoute>} />
          <Route path='/messages/:conversationId' element={<ProtectedRoute><MessagesLayout /></ProtectedRoute>} />
          <Route path='/messages/club/:clubId'  element={<ProtectedRoute><MessagesLayout /></ProtectedRoute>} />
          <Route path="/clubs/new" element={<ProtectedRoute><CreateClubPage /></ProtectedRoute>} />
          <Route path="/clubs/:clubId/settings" element={<ProtectedRoute><ClubSettingsPage /></ProtectedRoute>} />
          <Route path="/clubs/:clubId/activity" element={<ProtectedRoute><ClubActivityPage /></ProtectedRoute>} />
        </Route>
        
        <Route path='/oauth-callback' element={<OAuthCallback />} />
        <Route path='*' element={<Navigate to='/' />} />
        

</Routes>
      </BrowserRouter>
    </>
  )
}

export default App
