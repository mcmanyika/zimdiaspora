'use client'
import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function PaymentSuccess({ searchParams }) {
  const params = React.use(searchParams);
  const { amount } = params;

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-blue-500 to-purple-500 p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl w-full bg-white/10 backdrop-blur-lg p-8 rounded-2xl shadow-2xl border border-white/20"
      >
        <motion.div 
          initial={{ scale: 0.5 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
          className="text-center"
        >
          <motion.div
            initial={{ rotate: -10 }}
            animate={{ rotate: 0 }}
            transition={{ delay: 0.4, type: "spring" }}
          >
            <h1 className="text-5xl font-extrabold mb-4 text-white hover:text-purple-200 transition-colors">
              <Link href="/">Thank you! 🎉</Link>
            </h1>
          </motion.div>
          
          <motion.h2 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-2xl text-white/90 mb-6"
          >
          </motion.h2>

          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="bg-white/20 backdrop-blur-sm p-6 rounded-xl border border-white/30"
          >
            <div className="text-3xl font-bold text-white">
              
            Your payment was successful
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mt-8"
          >
            <Link 
              href="/"
              className="inline-block px-8 py-3 bg-white/20 hover:bg-white/30 text-white rounded-full transition-all duration-300 hover:scale-105"
            >
              Return Home
            </Link>
          </motion.div>
        </motion.div>
      </motion.div>
    </main>
  );
}
