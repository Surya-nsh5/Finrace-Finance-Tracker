import React from 'react'

const DeleteAlert = ({ content, onDelete }) => {
  return (
    <div>
        <p className="text-sm">{content}</p>

        <div className="flex justify-end mt-6">
            <button 
               type="button"
               className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm"
               onClick={onDelete}
            >
                Delete
            </button>
        </div>
    </div>
  )
}

export default DeleteAlert