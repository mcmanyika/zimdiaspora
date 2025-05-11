"use client";

import ProfileView from '../../modules/profiles/components/ProfileView';
import Admin from '../../components/layout/Admin';
import { withAuth } from '../../utils/withAuth';

function MyProfile() {
  return (
    <Admin>
      <div className="p-6">
        <ProfileView />
      </div>
    </Admin>
  );
} 
export default withAuth(MyProfile);