import React, { useState, useEffect } from 'react';
import { Calendar, User, Phone, Edit, Plus, Trash, Lock, Clock } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, addDoc, deleteDoc, doc, query, where } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';
import { firebaseConfig } from './firebaseConfig';
// import { db } from './firebaseConfig';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const App = () => {
  const [services, setServices] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [newService, setNewService] = useState({ name: '', duration: '', price: '' });
  const [newTimeSlot, setNewTimeSlot] = useState('');
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    fetchServices();
    fetchTimeSlots();
    fetchBookings();
  }, []);

  const fetchServices = async () => {
    try {
      const servicesCollection = collection(db, 'services');
      const servicesSnapshot = await getDocs(servicesCollection);
      const servicesList = servicesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setServices(servicesList);
    } catch (error) {
      console.error("Error fetching services:", error);
      // Handle error (e.g., show user-friendly message)
    }
  };

  const fetchTimeSlots = async () => {
    const timeSlotsCollection = collection(db, 'timeSlots');
    const timeSlotsSnapshot = await getDocs(timeSlotsCollection);
    const timeSlotsList = timeSlotsSnapshot.docs.map(doc => doc.data().slot);
    setTimeSlots(timeSlotsList);
  };

  const fetchBookings = async () => {
    const bookingsCollection = collection(db, 'bookings');
    const bookingsSnapshot = await getDocs(bookingsCollection);
    const bookingsList = bookingsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setBookings(bookingsList);
  };

  const handleServiceSelection = (service) => {
    setSelectedServices(prevSelected => {
      if (prevSelected.find(s => s.id === service.id)) {
        return prevSelected.filter(s => s.id !== service.id);
      } else {
        return [...prevSelected, service];
      }
    });
  };


  const handleBooking = async () => {
    if (selectedServices.length > 0 && selectedDate && selectedTime && customerName && customerPhone) {
      const newBooking = {
        name: customerName,
        phone: customerPhone,
        services: selectedServices.map(s => s.name),
        date: selectedDate,
        time: selectedTime,
        totalPrice: selectedServices.reduce((total, s) => total + s.price, 0),
        totalDuration: selectedServices.reduce((total, s) => total + s.duration, 0),
        createdAt: new Date() // Add timestamp for sorting and filtering
      };
      
      try {
        // Check for conflicting bookings
        const conflictingBookings = await checkConflictingBookings(selectedDate, selectedTime);
        if (conflictingBookings.length > 0) {
          alert('This time slot is already booked. Please choose another time.');
          return;
        }

        await addDoc(collection(db, 'bookings'), newBooking);
        alert('Booking confirmed!');
        fetchBookings();
        // Reset form
        setSelectedServices([]);
        setSelectedDate('');
        setSelectedTime('');
        setCustomerName('');
        setCustomerPhone('');
      } catch (error) {
        console.error("Error adding booking: ", error);
        alert('An error occurred while booking. Please try again.');
      }
    } else {
      alert('Please fill in all fields and select at least one service to book.');
    }
  };
  const checkConflictingBookings = async (date, time) => {
    const bookingsRef = collection(db, 'bookings');
    const q = query(bookingsRef, where('date', '==', date), where('time', '==', time));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs;
  };

  const handleAddService = async () => {
    if (newService.name && newService.duration && newService.price) {
      try {
        await addDoc(collection(db, 'services'), newService);
        setNewService({ name: '', duration: '', price: '' });
        fetchServices(); // Refresh services list
        alert('Service added successfully!');
      } catch (error) {
        console.error("Error adding service: ", error);
        if (error.code === 'permission-denied') {
          alert('Permission denied. Please make sure you are logged in and have the necessary permissions.');
        } else {
          alert('An error occurred while adding the service. Please try again.');
        }
      }
    } else {
      alert('Please fill in all fields for the new service.');
    }
  };

  const handleDeleteService = async (id) => {
    try {
      await deleteDoc(doc(db, 'services', id));
      fetchServices(); // Refresh services list
      setSelectedServices(selectedServices.filter(service => service.id !== id));
    } catch (error) {
      console.error("Error deleting service: ", error);
      alert('An error occurred while deleting the service. Please try again.');
    }
  };

  const handleAddTimeSlot = async () => {
    if (newTimeSlot) {
      try {
        await addDoc(collection(db, 'timeSlots'), { slot: newTimeSlot });
        setNewTimeSlot('');
        fetchTimeSlots(); // Refresh time slots list
      } catch (error) {
        console.error("Error adding time slot: ", error);
        alert('An error occurred while adding the time slot. Please try again.');
      }
    }
  };

  const handleDeleteTimeSlot = async (slot) => {
    try {
      const timeSlotsCollection = collection(db, 'timeSlots');
      const querySnapshot = await getDocs(timeSlotsCollection);
      querySnapshot.forEach((doc) => {
        if (doc.data().slot === slot) {
          deleteDoc(doc.ref);
        }
      });
      fetchTimeSlots(); // Refresh time slots list
    } catch (error) {
      console.error("Error deleting time slot: ", error);
      alert('An error occurred while deleting the time slot. Please try again.');
    }
  };

  const handleAdminLogin = () => {
    // In a real application, this should be done server-side
    if (adminUsername === 'admin' && adminPassword === 'admin123') {
      setIsAdminMode(true);
      setShowAdminLogin(false);
      setAdminUsername('');
      setAdminPassword('');
    } else {
      alert('Invalid username or password');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <div className="uppercase tracking-wide text-sm text-indigo-500 font-semibold">Beauty Salon</div>
            {isAdminMode ? (
              <button 
                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
                onClick={() => setIsAdminMode(false)}
              >
                Exit Admin Mode
              </button>
            ) : (
              <button 
                className="bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600 transition"
                onClick={() => setShowAdminLogin(true)}
              >
                Admin Login
              </button>
            )}
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            {isAdminMode ? 'Admin Dashboard' : 'Book Your Appointment'}
          </h1>
          
          {showAdminLogin && (
            <div className="mb-6 p-4 border rounded-lg">
              <h2 className="text-xl font-semibold mb-2">Admin Login</h2>
              <div className="space-y-4">
                <div className="flex items-center">
                  <User className="mr-2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Admin Username"
                    className="border rounded-lg p-2 w-full"
                    value={adminUsername}
                    onChange={(e) => setAdminUsername(e.target.value)}
                  />
                </div>
                <div className="flex items-center">
                  <Lock className="mr-2 text-gray-400" />
                  <input
                    type="password"
                    placeholder="Admin Password"
                    className="border rounded-lg p-2 w-full"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                  />
                </div>
                <button
                  className="w-full bg-indigo-500 text-white py-2 px-4 rounded-lg hover:bg-indigo-600 transition"
                  onClick={handleAdminLogin}
                >
                  Login
                </button>
              </div>
            </div>
          )}
          
          {isAdminMode ? (
            <div>
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2">Edit Services</h2>
                {services.map((service) => (
                  <div key={service.id} className="flex items-center mb-2">
                    <span className="flex-grow">{service.name} - {service.duration} min - ${service.price}</span>
                    <button onClick={() => handleDeleteService(service.id)} className="text-red-500"><Trash size={18} /></button>
                  </div>
                ))}
                <div className="flex space-x-2 mt-2">
                  <input
                    type="text"
                    placeholder="Service Name"
                    className="border rounded-lg p-2 flex-grow"
                    value={newService.name}
                    onChange={(e) => setNewService({...newService, name: e.target.value})}
                  />
                  <input
                    type="number"
                    placeholder="Duration (min)"
                    className="border rounded-lg p-2 w-24"
                    value={newService.duration}
                    onChange={(e) => setNewService({...newService, duration: parseInt(e.target.value)})}
                  />
                  <input
                    type="number"
                    placeholder="Price ($)"
                    className="border rounded-lg p-2 w-24"
                    value={newService.price}
                    onChange={(e) => setNewService({...newService, price: parseFloat(e.target.value)})}
                  />
                  <button onClick={handleAddService} className="bg-green-500 text-white p-2 rounded-lg"><Plus size={24} /></button>
                </div>
              </div>

              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2">Edit Time Slots</h2>
                {timeSlots.map((slot) => (
                  <div key={slot} className="flex items-center mb-2">
                    <span className="flex-grow">{slot}</span>
                    <button onClick={() => handleDeleteTimeSlot(slot)} className="text-red-500"><Trash size={18} /></button>
                  </div>
                ))}
                <div className="flex space-x-2 mt-2">
                  <input
                    type="text"
                    placeholder="New Time Slot"
                    className="border rounded-lg p-2 flex-grow"
                    value={newTimeSlot}
                    onChange={(e) => setNewTimeSlot(e.target.value)}
                  />
                  <button onClick={handleAddTimeSlot} className="bg-green-500 text-white p-2 rounded-lg"><Plus size={24} /></button>
                </div>
              </div>

              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2">View Bookings</h2>
                {bookings.length === 0 ? (
                  <p>No bookings yet.</p>
                ) : (
                  <div className="space-y-4">
                    {bookings.map((booking) => (
                      <div key={booking.id} className="border rounded-lg p-4">
                        <div className="flex items-center mb-2">
                          <User className="mr-2 text-gray-400" />
                          <span className="font-medium">{booking.name}</span>
                        </div>
                        <div className="flex items-center mb-2">
                          <Phone className="mr-2 text-gray-400" />
                          <span>{booking.phone}</span>
                        </div>
                        <div className="flex items-center mb-2">
                          <Edit className="mr-2 text-gray-400" />
                          <span>{booking.services.join(', ')}</span>
                        </div>
                        <div className="flex items-center mb-2">
                          <Calendar className="mr-2 text-gray-400" />
                          <span>{booking.date}</span>
                        </div>
                        <div className="flex items-center mb-2">
                          <Clock className="mr-2 text-gray-400" />
                          <span>{booking.time}</span>
                        </div>
                        <div className="flex items-center mb-2">
                          <span className="font-medium">Total Price: ${booking.totalPrice}</span>
                        </div>
                        <div className="flex items-center">
                          <span className="font-medium">Total Duration: {booking.totalDuration} minutes</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2">Customer Details</h2>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <User className="mr-2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Your Name"
                      className="border rounded-lg p-2 w-full"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center">
                    <Phone className="mr-2 text-gray-400" />
                    <input
                      type="tel"
                      placeholder="Your Phone Number"
                      className="border rounded-lg p-2 w-full"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2">Select Services (Multiple)</h2>
                <div className="grid grid-cols-2 gap-4">
                  {services.map((service) => (
                    <button
                      key={service.id}
                      className={`p-4 border rounded-lg text-left transition ${
                        selectedServices.find(s => s.id === service.id)
                          ? 'bg-indigo-100 border-indigo-500'
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => handleServiceSelection(service)}
                    >
                      <div className="font-medium">{service.name}</div>
                      <div className="text-sm text-gray-500">{service.duration} min | ${service.price}</div>
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2">Select a Date</h2>
                <div className="flex items-center">
                  <Calendar className="mr-2 text-gray-400" />
                  <input
                    type="date"
                    className="border rounded-lg p-2 w-full"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2">Select a Time</h2>
                <div className="grid grid-cols-4 gap-2">
                  {timeSlots.map((time) => (
                    <button
                      key={time}
                      className={`p-2 border rounded-lg transition ${
                        selectedTime === time
                          ? 'bg-indigo-100 border-indigo-500'
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedTime(time)}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2">Selected Services</h2>
                {selectedServices.length === 0 ? (
                  <p>No services selected</p>
                ) : (
                  <div className="space-y-2">
                    {selectedServices.map((service) => (
                      <div key={service.id} className="flex justify-between items-center">
                        <span>{service.name}</span>
                        <span>${service.price}</span>
                      </div>
                    ))}
                    <div className="border-t pt-2 mt-2">
                      <div className="flex justify-between items-center font-semibold">
                        <span>Total Price:</span>
                        <span>${selectedServices.reduce((total, s) => total + s.price, 0)}</span>
                      </div>
                      <div className="flex justify-between items-center font-semibold">
                        <span>Total Duration:</span>
                        <span>{selectedServices.reduce((total, s) => total + s.duration, 0)} minutes</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <button
                className="w-full bg-indigo-500 text-white py-2 px-4 rounded-lg hover:bg-indigo-600 transition"
                onClick={handleBooking}
              >
                Book Appointment
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;