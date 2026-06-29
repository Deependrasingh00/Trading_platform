import React from 'react'
import Header from './components/Header'
import Footer from './components/Footer'
import ScrollToTop from './components/ScrollToTop'
import { Outlet } from 'react-router-dom'

function App() {
  return (
    <div className="max-w-7xl mx-auto bg-[#0B1120] text-white min-h-screen flex flex-col">
      <ScrollToTop />
      <Header />
      <Outlet />
      <Footer />
    </div>
  )
}

export default App
