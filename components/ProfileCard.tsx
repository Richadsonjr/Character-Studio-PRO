
import React from 'react';
import { CharacterProfile } from '../types';

interface ProfileCardProps {
  profile: CharacterProfile;
}

const ProfileCard: React.FC<ProfileCardProps> = ({ profile }) => {
  return (
    <div className="bg-white rounded-3xl shadow-xl overflow-hidden max-w-md w-full border border-rose-50/50">
      <div className="relative h-64 overflow-hidden">
        <img 
          src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=1000&auto=format&fit=crop" 
          alt={`Representação de ${profile.name}`} 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
        <div className="absolute bottom-4 left-6 text-white">
          <h2 className="text-3xl font-bold">{profile.name}</h2>
          {/* Fix: Replaced non-existent 'origin' with 'state' and 'country' */}
          <p className="text-sm font-medium opacity-90">{profile.state}, {profile.country} • {profile.age} anos</p>
        </div>
      </div>
      
      <div className="p-6 space-y-4">
        <div>
          <h3 className="text-rose-800 text-xs font-bold uppercase tracking-widest mb-1">Estilo & Elegância</h3>
          <p className="text-gray-600 text-sm leading-relaxed">{profile.style}</p>
        </div>
        
        <div>
          <h3 className="text-rose-800 text-xs font-bold uppercase tracking-widest mb-1">Características</h3>
          {/* Fix: Replaced non-existent 'features' with 'physicalTraits' */}
          <p className="text-gray-600 text-sm leading-relaxed">{profile.physicalTraits}</p>
        </div>

        <div className="pt-2 flex flex-wrap gap-2">
          {['Modéstia Cristã', 'Carioca Suave', 'Elegância Clean', 'Fé'].map(tag => (
            <span key={tag} className="bg-rose-50 text-rose-700 text-[10px] px-2 py-1 rounded-full font-semibold uppercase tracking-wider">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProfileCard;
