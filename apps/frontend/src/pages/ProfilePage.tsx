import { useQuery } from 'react-query'
import { User, Mail, Calendar, Shield } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import ApiService from '@/services/apiService'
import LoadingSpinner from '@/components/common/LoadingSpinner'

const ProfilePage = () => {
  const { user } = useAuthStore()

  const { data: userProfile, isLoading } = useQuery(
    'userProfile',
    ApiService.getUserProfile
  )

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-bearish-500 text-white'
      case 'premium':
        return 'bg-warning-500 text-white'
      case 'user':
        return 'bg-primary-500 text-white'
      default:
        return 'bg-dark-600 text-trading-text'
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const profile = userProfile || user

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-primary-contrast">Profile</h1>
        <p className="text-secondary-contrast">Manage your account settings and preferences</p>
      </div>

      {/* Profile Information */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <div className="card">
            <div className="card-content p-6 text-center">
              <div className="w-24 h-24 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-white">
                  {profile?.first_name?.[0] || profile?.firstName?.[0]}
                  {profile?.last_name?.[0] || profile?.lastName?.[0]}
                </span>
              </div>
              <h3 className="text-lg font-medium text-primary-contrast">
                {profile?.first_name || profile?.firstName} {profile?.last_name || profile?.lastName}
              </h3>
              <p className="text-sm text-tertiary-contrast">@{profile?.username}</p>
              <div className="mt-3">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(
                    profile?.role || 'user'
                  )}`}
                >
                  {(profile?.role || 'user').charAt(0).toUpperCase() + (profile?.role || 'user').slice(1)} Account
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Account Details */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Account Information</h3>
            </div>
            <div className="card-content">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium form-label mb-1">
                      First Name
                    </label>
                    <div className="flex items-center">
                      <User className="w-4 h-4 text-muted-contrast mr-2" />
                      <span className="text-sm form-value">
                        {profile?.first_name || profile?.firstName}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium form-label mb-1">
                      Last Name
                    </label>
                    <div className="flex items-center">
                      <User className="w-4 h-4 text-muted-contrast mr-2" />
                      <span className="text-sm form-value">
                        {profile?.last_name || profile?.lastName}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium form-label mb-1">
                    Email Address
                  </label>
                  <div className="flex items-center">
                    <Mail className="w-4 h-4 text-muted-contrast mr-2" />
                    <span className="text-sm form-value">{profile?.email}</span>
                    {profile?.is_email_verified === false && (
                      <span className="ml-2 px-2 py-1 rounded-full text-xs font-medium bg-warning-100 text-warning-800">
                        Unverified
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium form-label mb-1">
                    Username
                  </label>
                  <div className="flex items-center">
                    <User className="w-4 h-4 text-muted-contrast mr-2" />
                    <span className="text-sm form-value">@{profile?.username}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium form-label mb-1">
                    Account Type
                  </label>
                  <div className="flex items-center">
                    <Shield className="w-4 h-4 text-muted-contrast mr-2" />
                    <span className="text-sm form-value capitalize">
                      {profile?.role || 'user'} Account
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium form-label mb-1">
                    Member Since
                  </label>
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 text-muted-contrast mr-2" />
                    <span className="text-sm form-value">
                      {profile?.created_at || profile?.createdAt
                        ? formatDate(profile.created_at || profile.createdAt)
                        : 'Unknown'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Account Settings */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Account Settings</h3>
        </div>
        <div className="card-content">
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-dark-600">
              <div>
                <h4 className="text-sm font-medium text-primary-contrast">Email Notifications</h4>
                <p className="text-sm text-tertiary-contrast">Receive email alerts for trades and market updates</p>
              </div>
              <button className="btn-secondary">Configure</button>
            </div>
            
            <div className="flex items-center justify-between py-3 border-b border-dark-600">
              <div>
                <h4 className="text-sm font-medium text-primary-contrast">Two-Factor Authentication</h4>
                <p className="text-sm text-tertiary-contrast">Add an extra layer of security to your account</p>
              </div>
              <button className="btn-secondary">Enable</button>
            </div>
            
            <div className="flex items-center justify-between py-3 border-b border-dark-600">
              <div>
                <h4 className="text-sm font-medium text-primary-contrast">API Keys</h4>
                <p className="text-sm text-tertiary-contrast">Manage API keys for external integrations</p>
              </div>
              <button className="btn-secondary">Manage</button>
            </div>
            
            <div className="flex items-center justify-between py-3">
              <div>
                <h4 className="text-sm font-medium text-primary-contrast">Data Export</h4>
                <p className="text-sm text-tertiary-contrast">Download your trading data and account information</p>
              </div>
              <button className="btn-secondary">Export</button>
            </div>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="card border-red-200">
        <div className="card-header">
          <h3 className="card-title text-red-700">Danger Zone</h3>
        </div>
        <div className="card-content">
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-bearish-600">
              <div>
                <h4 className="text-sm font-medium text-bearish-400">Change Password</h4>
                <p className="text-sm text-tertiary-contrast">Update your account password</p>
              </div>
              <button className="btn-secondary">Change Password</button>
            </div>
            
            <div className="flex items-center justify-between py-3">
              <div>
                <h4 className="text-sm font-medium text-bearish-400">Delete Account</h4>
                <p className="text-sm text-tertiary-contrast">
                  Permanently delete your account and all associated data
                </p>
              </div>
              <button className="btn-danger">Delete Account</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfilePage