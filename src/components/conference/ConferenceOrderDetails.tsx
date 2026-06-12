
import React from 'react';

interface PersonalInfo {
  firstName: string;
  lastName: string;
  company: string;
  conferenceRoom: string;
}

interface ConferenceOrderDetailsProps {
  personalInfo: PersonalInfo;
  guestType: string;
  lunchSelection: string;
  dinnerSelection?: string;
  menuDate: string;
}

const ConferenceOrderDetails: React.FC<ConferenceOrderDetailsProps> = ({
  personalInfo,
  guestType,
  lunchSelection,
  dinnerSelection,
  menuDate
}) => {
  const getGuestTypeLabel = () => {
    return guestType === 'day_guest' ? 'Tagungsgast' : 'Tagungsgast + Übernachtung';
  };

  const getRoomLabel = () => {
    const rooms: Record<string, string> = {
      berlin: 'Berlin',
      hamburg: 'Hamburg',
      frankfurt: 'Frankfurt',
      bonn: 'Bonn'
    };
    return rooms[personalInfo.conferenceRoom] || personalInfo.conferenceRoom;
  };

  return (
    <div className="space-y-5">
      {/* Personal Information Card */}
      <div className="bg-gradient-to-br from-gray-900 to-black border border-apple/30 rounded-2xl shadow-2xl shadow-apple/10 overflow-hidden">
        <div className="bg-gradient-to-r from-apple/20 to-yellow-600/20 border-b border-apple/40 px-6 py-4">
          <h2 className="text-lg font-semibold text-apple flex items-center">
            <svg className="w-5 h-5 mr-2 text-apple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Persönliche Daten
          </h2>
        </div>
        <div className="p-6">
          <dl className="grid grid-cols-1 gap-4">
            <div className="flex items-start">
              <dt className="text-gray-400 font-medium w-32 flex-shrink-0">Name:</dt>
              <dd className="text-white font-medium">{personalInfo.firstName} {personalInfo.lastName}</dd>
            </div>
            <div className="flex items-start">
              <dt className="text-gray-400 font-medium w-32 flex-shrink-0">Firma:</dt>
              <dd className="text-white font-medium">{personalInfo.company}</dd>
            </div>
            <div className="flex items-start">
              <dt className="text-gray-400 font-medium w-32 flex-shrink-0">Tagungsraum:</dt>
              <dd className="text-white font-medium flex items-center">
                <svg className="w-4 h-4 mr-2 text-apple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                {getRoomLabel()}
              </dd>
            </div>
            <div className="flex items-start">
              <dt className="text-gray-400 font-medium w-32 flex-shrink-0">Gästetyp:</dt>
              <dd className="text-white font-medium">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-apple/20 text-apple border border-apple/40">
                  {getGuestTypeLabel()}
                </span>
              </dd>
            </div>
          </dl>
        </div>
      </div>
      
      {/* Selected Meals Card */}
      <div className="bg-gradient-to-br from-gray-900 to-black border border-apple/30 rounded-2xl shadow-2xl shadow-apple/10 overflow-hidden">
        <div className="bg-gradient-to-r from-apple/20 to-yellow-600/20 border-b border-apple/40 px-6 py-4">
          <h2 className="text-lg font-semibold text-apple flex items-center">
            <svg className="w-5 h-5 mr-2 text-apple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Gewählte Mahlzeiten
          </h2>
        </div>
        
        <div className="p-6 space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-apple/20">
            <svg className="w-5 h-5 text-apple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-base font-semibold text-apple">Menü für {menuDate}</p>
          </div>
          
          <div className="bg-black/50 rounded-xl p-4 border border-apple/20">
            <div className="flex items-start gap-3 mb-2">
              <svg className="w-5 h-5 text-apple mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <div className="flex-1">
                <h3 className="font-semibold text-apple mb-1 text-base">Mittagessen</h3>
                <p className="text-gray-300 leading-relaxed">{lunchSelection}</p>
              </div>
            </div>
          </div>
          
          {guestType === 'overnight_guest' && dinnerSelection && (
            <div className="bg-black/50 rounded-xl p-4 border border-apple/20">
              <div className="flex items-start gap-3 mb-2">
                <svg className="w-5 h-5 text-apple mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
                <div className="flex-1">
                  <h3 className="font-semibold text-apple mb-1 text-base">Abendessen</h3>
                  <p className="text-gray-300 leading-relaxed">{dinnerSelection}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConferenceOrderDetails;
