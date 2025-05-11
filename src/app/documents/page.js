'use client'
import React, { useState, useEffect, useRef } from 'react'
import withAuth from '../../utils/withAuth'
import Admin from "../../components/layout/Admin";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { toast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

function DocumentsPage() {
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [selectedCategory, setSelectedCategory] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [sortField, setSortField] = useState('created_at')
  const [sortDirection, setSortDirection] = useState('desc')
  const [userEmail, setUserEmail] = useState(null)
  const documentsPerPage = 6
  const fileInputRef = useRef(null)
  const supabase = createClientComponentClient()

  const documentCategories = [
    { id: 'bank_statements', label: 'Bank Statements' },
    { id: 'title_deeds', label: 'Title Deeds' },
    { id: 'letters', label: 'Letters & Documents' }
  ]

  useEffect(() => {
    fetchUserEmail()
    fetchDocuments()
  }, [currentPage, sortField, sortDirection])

  const fetchUserEmail = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserEmail(user.email)
      }
    } catch (error) {
      console.error('Error fetching user email:', error)
    }
  }

  const fetchDocuments = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error, count } = await supabase
        .from('documents')
        .select('*', { count: 'exact' })
        .order(sortField, { ascending: sortDirection === 'asc' })
        .range((currentPage - 1) * documentsPerPage, currentPage * documentsPerPage - 1)

      if (error) throw error
      setDocuments(data || [])
      setTotalPages(Math.ceil((count || 0) / documentsPerPage))
    } catch (error) {
      console.error('Error fetching documents:', error)
      toast.error('Failed to load documents')
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = (event) => {
    const file = event.target.files[0]
    if (file) {
      setSelectedFile(file)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile || !selectedCategory) {
      toast.error('Please select both a file and a category')
      return
    }

    try {
      setUploading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      // Upload file to storage
      const fileExt = selectedFile.name.split('.').pop()
      const fileName = `${user.id}/${selectedCategory}/${Date.now()}.${fileExt}`
      
      console.log('Attempting to upload file:', {
        fileName,
        fileType: selectedFile.type,
        fileSize: selectedFile.size
      })

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('project-documents')
        .upload(fileName, selectedFile, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        console.error('Storage upload error:', {
          error: uploadError,
          message: uploadError.message,
          details: uploadError.details,
          hint: uploadError.hint
        })
        throw uploadError
      }

      console.log('File uploaded successfully:', uploadData)

      // Create document record in database
      const { data: docData, error: dbError } = await supabase
        .from('documents')
        .insert([
          {
            user_id: user.id,
            category: selectedCategory,
            file_name: selectedFile.name,
            file_path: fileName,
            file_type: selectedFile.type,
            file_size: selectedFile.size
          }
        ])
        .select()
        .single()

      if (dbError) {
        console.error('Database insert error:', {
          error: dbError,
          message: dbError.message,
          details: dbError.details,
          hint: dbError.hint
        })
        throw dbError
      }

      console.log('Document record created:', docData)

      toast.success('Document uploaded successfully')
      
      // Clear the form
      setSelectedFile(null)
      setSelectedCategory('')
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      
      fetchDocuments()
    } catch (error) {
      console.error('Error uploading document:', {
        error,
        message: error.message,
        details: error.details,
        hint: error.hint
      })
      toast.error(error.message || 'Failed to upload document')
    } finally {
      setUploading(false)
    }
  }

  const handleDownload = async (docItem) => {
    try {
      const { data, error } = await supabase.storage
        .from('project-documents')
        .download(docItem.file_path)

      if (error) throw error

      // Create download link
      const url = URL.createObjectURL(data)
      const link = document.createElement('a')
      link.href = url
      link.download = docItem.file_name
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading document:', error)
      toast.error('Failed to download document')
    }
  }

  const handleDelete = async (docItem) => {
    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('project-documents')
        .remove([docItem.file_path])

      if (storageError) throw storageError

      // Delete from database
      const { error: dbError } = await supabase
        .from('documents')
        .delete()
        .eq('id', docItem.id)

      if (dbError) throw dbError

      toast.success('Document deleted successfully')
      fetchDocuments()
    } catch (error) {
      console.error('Error deleting document:', error)
      toast.error('Failed to delete document')
    }
  }

  const handleSort = (field) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const getSortIcon = (field) => {
    if (field !== sortField) return '↕'
    return sortDirection === 'asc' ? '↑' : '↓'
  }

  return (
    <Admin>
      <div className="p-6">
        <ToastContainer
          position="bottom-center"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="dark"
        />

        {/* Upload Section - Only visible to specific email */}
        {(userEmail === 'partsonmanyika@gmail.com' || userEmail === 'mak@creativeastro.com') && (
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <h2 className="text-lg font-semibold mb-4">Upload New Document</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Document Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="">Select a category</option>
                  {documentCategories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select File
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  className="w-full p-2 border rounded-md"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                />
              </div>

              <button
                onClick={handleUpload}
                disabled={uploading || !selectedFile || !selectedCategory}
                className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:bg-blue-300"
              >
                {uploading ? 'Uploading...' : 'Upload Document'}
              </button>
            </div>
          </div>
        )}

        {/* Documents List */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-4">Your Documents</h2>
          {loading ? (
            <div className="text-center py-4">Loading documents...</div>
          ) : documents.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              No documents uploaded yet
            </div>
          ) : (
            <>
              {/* Table Headers */}
              <div className="grid grid-cols-12 gap-4 mb-4 px-4 font-medium text-gray-500">
                <div 
                  className="col-span-4 cursor-pointer hover:text-gray-700"
                  onClick={() => handleSort('file_name')}
                >
                  File Name {getSortIcon('file_name')}
                </div>
                <div 
                  className="col-span-3 cursor-pointer hover:text-gray-700"
                  onClick={() => handleSort('category')}
                >
                  Category {getSortIcon('category')}
                </div>
                <div 
                  className="col-span-3 cursor-pointer hover:text-gray-700"
                  onClick={() => handleSort('created_at')}
                >
                  Upload Date {getSortIcon('created_at')}
                </div>
                <div className="col-span-2 text-right">
                  Actions
                </div>
              </div>

              <div className="space-y-4">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="grid grid-cols-12 gap-4 items-center p-4 border rounded-md"
                  >
                    <div className="col-span-4">
                      <h3 className="font-medium">{doc.file_name}</h3>
                    </div>
                    <div className="col-span-3">
                      {documentCategories.find(c => c.id === doc.category)?.label}
                    </div>
                    <div className="col-span-3">
                      {new Date(doc.created_at).toLocaleDateString()}
                    </div>
                    <div className="col-span-2 flex justify-end space-x-2">
                      <button
                        onClick={() => handleDownload(doc)}
                        className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                      >
                        Download
                      </button>
                      {userEmail === 'partsonmanyika@gmail.com' || userEmail === 'mak@creativeastro.com' ? (
                        <button
                          onClick={() => {
                            if (window.confirm('Are you sure you want to delete this document?')) {
                              handleDelete(doc)
                            }
                          }}
                          className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                        >
                          Delete
                        </button>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-6 flex justify-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  
                  <div className="flex items-center space-x-2">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-1 text-sm rounded ${
                          currentPage === page
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Admin>
  )
}

export default withAuth(DocumentsPage)
