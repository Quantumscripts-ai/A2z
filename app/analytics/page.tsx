'use client'
import React, { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'

const AnalyticsPage = () => {
  const [totalDuration, setTotalDuration] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Mock data for charts - replace with actual data later
  const subscriptionData = [
    { date: '2024-01-01', subscriptions: 12, amount: 1200 },
    { date: '2024-01-02', subscriptions: 18, amount: 1800 },
    { date: '2024-01-03', subscriptions: 15, amount: 1500 },
    { date: '2024-01-04', subscriptions: 22, amount: 2200 },
    { date: '2024-01-05', subscriptions: 25, amount: 2500 },
    { date: '2024-01-06', subscriptions: 30, amount: 3000 },
    { date: '2024-01-07', subscriptions: 28, amount: 2800 },
  ]

  const hoursTranslatedData = [
    { month: 'Jan', hours: 45.5 },
    { month: 'Feb', hours: 52.3 },
    { month: 'Mar', hours: 48.7 },
    { month: 'Apr', hours: 61.2 },
    { month: 'May', hours: 58.9 },
    { month: 'Jun', hours: 67.4 },
  ]

  const subscriptionTypes = [
    { name: 'Free', value: 45, color: '#10B981' },
    { name: 'Pro', value: 30, color: '#3B82F6' },
    { name: 'Business', value: 25, color: '#8B5CF6' },
  ]

  useEffect(() => {
    async function fetchVideos() {
      console.log("📥 Fetching videos from Supabase...")
      setError(null)

      const { data: videos, error } = await supabase
        .from("videos")
        .select("*")

      if (error) {
        console.error("error:", error.message)
        setError(`Failed to fetch videos: ${error.message}`)
        return
      }

      if (!videos || videos.length === 0) {
        console.warn("No videos found in the table.")
        setError("No videos found in the database.")
        return
      }

      console.log(`Found ${videos.length} videos:`, videos)

      let total = 0
      let processedCount = 0
      let skippedCount = 0

      for (const vid of videos) {
        if (!vid.storage_path) {
          console.warn(`Skipping video ${vid.id} (${vid.filename}) - no storage_path`)
          skippedCount++
          continue
        }

        try {
          console.log(`Attempting to create signed URL for: ${vid.storage_path}`)
          const response = await fetch('/api/storage/signed-url', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              storagePath: vid.storage_path,
              expiresIn: 60 * 60 
            })
          })

          if (!response.ok) {
            const errorData = await response.json()
            console.error(`Failed to get signed URL for ${vid.filename}`, errorData.error)
            console.error(`Storage path: ${vid.storage_path}`)
            console.error(`Error details:`, errorData.error)
            skippedCount++
            continue
          }

          const { signedUrl } = await response.json()
          console.log(`Loading video: ${vid.filename} (${signedUrl})`)

          const duration = await getVideoDuration(signedUrl)
          console.log(`Duration of ${vid.filename}: ${duration.toFixed(2)}s`)
          total += duration
          processedCount++
        } catch (err) {
          console.error(`Error fetching duration for ${vid.filename}:`, err)
          console.error(`Storage path: ${vid.storage_path}`)
          skippedCount++
        }
      }

      console.log(`Processing complete:`)
      console.log(`- Total videos: ${videos.length}`)
      console.log(`- Successfully processed: ${processedCount}`)
      console.log(`- Skipped: ${skippedCount}`)
      console.log(`- Total duration: ${total.toFixed(2)}s`)
      
      setTotalDuration(total)
      
      if (skippedCount > 0) {
        setError(`${skippedCount} videos could not be processed. Check console for details.`)
      }
    }

    fetchVideos()
  }, [])

  function getVideoDuration(url: string): Promise<number> {
    return new Promise((resolve, reject) => {
      const video = document.createElement("video")
      video.src = url
      video.preload = "metadata"

      video.onloadedmetadata = () => {
        resolve(video.duration) 
      }

      video.onerror = () => {
        reject(new Error(`Failed to load video: ${url}`))
      }
    })
  }

  function formatTime(seconds: number) {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = Math.floor(seconds % 60)
    return `${h}h ${m}m ${s}s`
  }

  return (
    <div className="p-6 space-y-8">
      {/* Page Header */}
      <div className="border-b border-gray-200 pb-6">
        <h1 className="text-3xl font-bold text-white">Analytics Dashboard</h1>
        <p className="text-gray-400 mt-2">Track your platform performance and user engagement</p>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Subscriptions</p>
              <p className="text-2xl font-bold text-gray-900">1,247</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Amount Credited</p>
              <p className="text-2xl font-bold text-gray-900">$24,580</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Hours Translated</p>
              <p className="text-2xl font-bold text-gray-900">334.2</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Video Duration</p>
              <p className="text-2xl font-bold text-gray-900">
                {totalDuration !== null ? formatTime(totalDuration) : '...'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Subscriptions per Day Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Subscriptions per Day</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={subscriptionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="subscriptions" stroke="#3B82F6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Amount Credited Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Amount Credited</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={subscriptionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="amount" fill="#10B981" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Hours Translated Chart */}
      </div>

      {/* Video Duration Section - Keeping existing functionality */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Video Processing Analytics</h3>
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
        
        {totalDuration !== null ? (
          <div className="text-center">
            <p className="text-3xl font-bold text-purple-600 mb-2">
              {formatTime(totalDuration)}
            </p>
            <p className="text-gray-600">Total Video Duration Processed</p>
            <p className="text-sm text-gray-500 mt-1">
              ({totalDuration.toFixed(2)} seconds)
            </p>
          </div>
        ) : (
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-gray-500">Calculating total duration...</p>
          </div>
        )}
      </div>

    </div>
  )
}

export default AnalyticsPage
