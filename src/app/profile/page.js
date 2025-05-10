"use client";

import ProfileView from '../../modules/profiles/components/ProfileView';
import Admin from '../../components/layout/Admin';
import Header from '../../components/layout/Header';

export default function MyProfile() {
  return (
    <Admin>
      <ProfileView />
    </Admin>
  )
} 