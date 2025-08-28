import React from 'react';
import { User, Mail, UserCog, DollarSign, Calendar, Shield } from 'lucide-react';

const UserProfile = ({ user }) => {
  if (!user) return null;

  // Formatar data de criação
  const formatDate = (dateString) => {
    if (!dateString) return 'Não disponível';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-MZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Traduzir o papel do usuário
  const getRoleName = (role) => {
    const roles = {
      admin: 'Administrador',
      manager: 'Gerente',
      cashier: 'Caixa',
      stockist: 'Estoquista'
    };
    return roles[role] || role;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center space-x-4 mb-6">
        <div className="bg-blue-100 p-3 rounded-full">
          <User size={24} className="text-blue-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-800">{user.full_name}</h2>
          <p className="text-gray-600">@{user.username}</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center space-x-3">
          <Mail size={18} className="text-gray-500" />
          <span className="text-gray-700">{user.email || 'Não informado'}</span>
        </div>

        <div className="flex items-center space-x-3">
          <UserCog size={18} className="text-gray-500" />
          <span className="text-gray-700">
            {getRoleName(user.role)} {user.is_superuser && '(Superusuário)'}
          </span>
        </div>

        {user.salary && (
          <div className="flex items-center space-x-3">
            <DollarSign size={18} className="text-gray-500" />
            <span className="text-gray-700">
              Salário: {parseFloat(user.salary).toLocaleString('pt-MZ', {
                style: 'currency',
                currency: 'MZN'
              })}
            </span>
          </div>
        )}

        <div className="flex items-start space-x-3">
          <Calendar size={18} className="text-gray-500 mt-1 flex-shrink-0" />
          <div>
            <p className="text-sm text-gray-500">Membro desde</p>
            <p className="text-gray-700">{formatDate(user.created_at)}</p>
          </div>
        </div>

        <div className="flex items-start space-x-3">
          <Shield size={18} className="text-gray-500 mt-1 flex-shrink-0" />
          <div>
            <p className="text-sm text-gray-500">Status da conta</p>
            <div className="flex items-center">
              <span className={`h-2 w-2 rounded-full mr-2 ${user.is_active ? 'bg-green-500' : 'bg-red-500'}`}></span>
              <span className="text-gray-700">
                {user.is_active ? 'Ativa' : 'Inativa'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
