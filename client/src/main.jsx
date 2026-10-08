import React from 'react';import ReactDOM from 'react-dom/client';import {BrowserRouter,Navigate,Outlet,Route,Routes,useLocation} from 'react-router-dom';import 'bootstrap/dist/css/bootstrap.min.css';import 'bootstrap-icons/font/bootstrap-icons.css';import 'bootstrap/dist/js/bootstrap.bundle.min.js';import './styles.css';
import {AuthProvider} from './context/AuthContext';import Navbar from './components/Navbar';import Footer from './components/Footer';import ProtectedRoute from './components/ProtectedRoute';import Home from './pages/Home';import Farmhouses from './pages/Farmhouses';import Details from './pages/Details';import Login from './pages/Login';import Register from './pages/Register';import Dashboard from './pages/Dashboard';import OwnerDashboard from './pages/OwnerDashboard';import OwnerProperties from './pages/OwnerProperties';import OwnerBookingRequests from './pages/OwnerBookingRequests';import NewFarmhouse from './pages/NewFarmhouse';import EditFarmhouse from './pages/EditFarmhouse';import AdminDashboard from './pages/AdminDashboard';import Profile from './pages/Profile';import Wishlist from './pages/Wishlist';import Notifications from './pages/Notifications';
function ScrollToTop(){
  const {pathname,search} = useLocation();
  React.useLayoutEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [pathname, search]);
  return null;
}
function Layout(){return <><ScrollToTop/><Navbar/><main><Outlet/></main><Footer/></>}
function App(){return <AuthProvider><Routes><Route path="/login" element={<Login/>}/><Route path="/register" element={<Register/>}/><Route element={<Layout/>}><Route path="/" element={<Home/>}/><Route path="/farmhouses" element={<Farmhouses/>}/><Route path="/farmhouses/:id" element={<Details/>}/><Route element={<ProtectedRoute roles={['user','owner','admin']}/>}><Route path="/profile" element={<Profile/>}/><Route path="/notifications" element={<Notifications/>}/></Route><Route element={<ProtectedRoute roles={['user']}/>}><Route path="/dashboard" element={<Dashboard/>}/><Route path="/wishlist" element={<Wishlist/>}/></Route><Route element={<ProtectedRoute roles={['owner']}/>}><Route path="/owner" element={<OwnerDashboard/>}/><Route path="/owner/properties" element={<OwnerProperties/>}/><Route path="/owner/booking-requests" element={<OwnerBookingRequests/>}/><Route path="/owner/new" element={<NewFarmhouse/>}/><Route path="/owner/edit/:id" element={<EditFarmhouse/>}/></Route><Route element={<ProtectedRoute roles={['admin']}/>}><Route path="/admin" element={<AdminDashboard/>}/></Route><Route path="*" element={<Navigate to="/" replace/>}/></Route></Routes></AuthProvider>}
if ('scrollRestoration' in window.history) {
  window.history.scrollRestoration = 'manual';
}
ReactDOM.createRoot(document.getElementById('root')).render(<React.StrictMode><BrowserRouter><App/></BrowserRouter></React.StrictMode>);
