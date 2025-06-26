// Web app pemantauan & reservasi meja restoran (Admin & User)
// Dengan Firebase Auth login khusus Admin

// Web app pemantauan & reservasi meja restoran (Admin & User) + waktu reservasi + validasi, alert & auto-reset

import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { Button } from "./components/ui/button";
import { Card } from "./components/ui/card";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, set } from "firebase/database";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "firebase/auth";
import toast, { Toaster } from "react-hot-toast";
import Swal from "sweetalert2";

const firebaseConfig = {
  apiKey: "AIzaSyBtp_Bf2WYhUliU8WG6H8V_fmPVNyNpAwc",
  authDomain: "esp32iot-f8bab.firebaseapp.com",
  databaseURL: "https://esp32iot-f8bab-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "esp32iot-f8bab",
  storageBucket: "esp32iot-f8bab.firebasestorage.app",
  messagingSenderId: "357668829684",
  appId: "1:357668829684:web:3cc915abfd1763ab2aa1a1",
  measurementId: "G-MJEVL82HHR"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const auth = getAuth(app);

function TableCard({ tableId, data, isAdmin }) {
  const { occupied, reservedBy } = data || {};
  const [formVisible, setFormVisible] = useState(false);
  const [nama, setNama] = useState("");
  const [telp, setTelp] = useState("");
  const [waktu, setWaktu] = useState(""); 
  const [error, setError] = useState("");
  const seat = data?.seat || "";
useEffect(() => {
  if (reservedBy?.waktu) {
    const waktuBooking = new Date(reservedBy.waktu);
    const expireTime = waktuBooking.getTime() + 30 * 60 * 1000; // +30 menit
    const now = new Date().getTime();

    if (now > expireTime) {
      // Sudah lewat 30 menit dari waktu reservasi
      set(ref(database, `meja/${tableId}`), {
        occupied: false,
        reservedBy: null,
        seat: seat || "4"
      });
      toast.success(`Meja ${tableId} dikosongkan otomatis (expired)`);
    }
  }
}, [reservedBy, tableId, seat]);


  const toggleOccupancy = () => {
    const newStatus = !occupied;
    set(ref(database, `meja/${tableId}/occupied`), newStatus);
  };

 const handleReservation = () => {
  if (!nama || !telp || !waktu) {
    setError("Nama, Nomor Telepon, dan Waktu wajib diisi.");
    return;
  }

  const selectedTime = new Date(waktu);
  const now = new Date();
  const threeHoursFromNow = new Date(now.getTime() + 3 * 60 * 60 * 1000);

  if (selectedTime < threeHoursFromNow) {
    toast.error("Reservasi harus dilakukan minimal 3 jam sebelum waktu yang dipilih.");
    return;
  }
  if (selectedTime <= now) {
    toast.error("Waktu reservasi harus di masa depan.");
    return;
  }

  const reservedRef = ref(database, `meja/${tableId}/reservedBy`);
  const mejaRef = ref(database, `meja/${tableId}`);

  onValue(reservedRef, (snapshot) => {
    if (snapshot.exists()) {
      alert("Meja sudah dipesan!");
    } else {
      set(mejaRef, {
        occupied: true,
        seat: `4`,
        reservedBy: { nama, telp, waktu },
      });
      toast.success(`Reservasi atas nama ${nama} berhasil!`);
      setFormVisible(false);
      setNama("");
      setTelp("");
      setWaktu("");
      setError("");
    }
  }, { onlyOnce: true });
};


  const cancelReservation = () => {
    Swal.fire({
      title: "Yakin batalin reservasi?",
      text: "Reservasi akan dihapus permanen.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Ya, batalkan"
    }).then((result) => {
      if (result.isConfirmed) {
        set(ref(database, `meja/${tableId}`), {
          occupied: false
        });
        toast.success("Reservasi berhasil dibatalkan.");
      }
    });
  };

  const isExpired = reservedBy?.waktu && new Date(reservedBy.waktu).getTime() + 30 * 60 * 1000 < new Date().getTime();

  useEffect(() => {
    if (isExpired && occupied) {
      const timeout = setTimeout(() => {
        set(ref(database, `meja/${tableId}`), { occupied: false });
      }, 1000);
      return () => clearTimeout(timeout);
    }
  }, [isExpired, occupied]);

  return (
    <Card className={`w-60 h-auto flex flex-col items-center justify-center m-12 p-8 shadow ${isExpired ? 'bg-yellow-50 border-yellow-300' : ''}`}>
      <Toaster />
      <div className={`text-lg font-bold ${occupied ? "text-red-500" : "text-green-500"}`}>{tableId}</div>
      <div className="text-sm font-bold">
        {(seat ? seat : 4) + " Kursi"}
      </div>
      <div className="text-sm mt-1">
  {occupied
    ? "Terisi"
    : reservedBy
    ? "Dipesan"
    : "Kosong"}
</div>


      {reservedBy && (
        <div className="text-xs mt-1 text-center">
          <p><b>{reservedBy.nama}</b></p>
          <p className="text-gray-500">{reservedBy.telp}</p>
          {reservedBy.waktu && <p className="text-gray-400 text-[11px]">{reservedBy.waktu.replace("T", " • ")}</p>}
        </div>
      )}

      {isAdmin && (
        <>
          <Button className="mt-2 text-xs" onClick={toggleOccupancy}>Ubah Status</Button>
          {reservedBy && (
            <Button variant="destructive" className="mt-2 text-xs" onClick={cancelReservation}>Hapus Reservasi</Button>
          )}
        </>
      )}

      {/* {!isAdmin && occupied && reservedBy && (
        <Button variant="destructive" className="mt-2 text-xs" onClick={cancelReservation}>Batalkan Reservasi</Button>
      )} */}

      {!isAdmin && !occupied && !formVisible && !reservedBy && (
  <Button className="mt-2 text-xs" onClick={() => setFormVisible(true)}>Reservasi</Button>
)}
      {formVisible && (
        <div className="flex flex-col items-center mt-2 text-xs w-full">
          <input className="border p-1 text-xs mb-1 w-36" placeholder="Nama" value={nama} onChange={(e) => setNama(e.target.value)} />
          <input className="border p-1 text-xs mb-1 w-36" placeholder="No. Telp" value={telp} onChange={(e) => setTelp(e.target.value)} />
          <label className="text-[10px] mb-1 text-gray-500">Waktu Reservasi:</label>
          <input type="datetime-local" className="border p-1 text-xs mb-1 w-36" value={waktu} onChange={(e) => setWaktu(e.target.value)} />
          {error && <div className="text-red-500 text-xs mb-1">{error}</div>}
          <Button className="text-xs" onClick={handleReservation}>Simpan</Button>
        </div>
      )}
    </Card>
  );
}





function TableDisplay({ isAdmin }) {
  const [tableData, setTableData] = useState({});

  useEffect(() => {
    const mejaRef = ref(database, "meja");
    onValue(mejaRef, (snapshot) => {
      const data = snapshot.val();
      setTableData(data || {});
    });
  }, []);

  return (
    <div className="flex flex-wrap">
      {Object.entries(tableData).map(([id, data]) => (
        <TableCard key={id} tableId={id} data={data} isAdmin={isAdmin} />
      ))}
    </div>
  );
}

function AdminPanel({ onLogout }) {
  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Panel Admin</h2>
        <Button className="text-xs" onClick={onLogout}>Logout</Button>
      </div>
      <TableDisplay isAdmin={true} />
    </div>
  );
}

function UserPanel() {
  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Reservasi Meja</h2>
      <TableDisplay isAdmin={false} />
    </div>
  );
}

function LoginPage({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      onLogin();
      navigate("/admin");
    } catch (err) {
      setError("Email atau password salah");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-indigo-200">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md flex flex-col items-center">
        <h2 className="text-2xl font-bold mb-6 text-indigo-700">Login Admin</h2>
        <div className="w-full flex flex-col gap-4">
          <input
            className="border border-indigo-300 rounded-lg p-3 w-full text-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className="border border-indigo-300 rounded-lg p-3 w-full text-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && <div className="text-red-500 text-base text-center">{error}</div>}
          <Button className="w-full py-3 text-lg bg-indigo-600 hover:bg-indigo-700 transition rounded-lg" onClick={handleLogin}>
            Login
          </Button>
        </div>
      </div>
    </div>
  );
}

function Home() {
  return <Navigate to="/user" />;
}

export default function App() {
  const [adminLoggedIn, setAdminLoggedIn] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAdminLoggedIn(!!user);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = () => signOut(auth);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<LoginPage onLogin={() => setAdminLoggedIn(true)} />} />
        <Route
          path="/admin"
          element={adminLoggedIn ? <AdminPanel onLogout={handleLogout} /> : <Navigate to="/login" />}
        />
        <Route path="/user" element={<UserPanel />} />
      </Routes>
    </Router>
  );
}
