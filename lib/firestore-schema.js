// Firestore Collections Schema (Reference Only)

/*
COLLECTIONS:

1. users/{userId}
   - uid: string
   - email: string
   - phone: string
   - name: string
   - role: 'client' | 'worker'
   - area: string
   - createdAt: timestamp
   - profilePhoto: string (url)
   - language: 'en' | 'hi'

2. workers/{userId}
   - uid: string
   - name: string
   - phone: string
   - area: string
   - skills: string[] (category ids)
   - experience: string
   - ratePerHour: number
   - bio: string
   - aadhaarNumber: string
   - aadhaarStatus: 'pending' | 'verified'
   - profilePhoto: string
   - coverPhoto: string
   - rating: number
   - totalReviews: number
   - completedJobs: number
   - badge: string
   - isOnline: boolean
   - createdAt: timestamp

3. jobs/{jobId}
   - jobId: string
   - clientId: string
   - workerId: string
   - clientName: string
   - workerName: string
   - serviceType: string
   - description: string
   - address: string
   - area: string
   - date: string
   - time: string
   - offeredAmount: number
   - finalAmount: number
   - paymentMethod: 'online' | 'cash'
   - paymentStatus: 'pending' | 'paid'
   - status: JOB_STATUS
   - otp: string
   - workPhotos: string[]
   - createdAt: timestamp
   - updatedAt: timestamp

4. reviews/{reviewId}
   - reviewId: string
   - jobId: string
   - clientId: string
   - workerId: string
   - rating: number
   - comment: string
   - tags: string[]
   - isVerified: boolean
   - createdAt: timestamp

5. chats/{chatId}
   - chatId: string (jobId)
   - clientId: string
   - workerId: string
   - lastMessage: string
   - lastMessageTime: timestamp
   - jobStatus: string

6. messages/{chatId}/messages/{messageId}
   - messageId: string
   - senderId: string
   - text: string
   - createdAt: timestamp
   - read: boolean
*/
