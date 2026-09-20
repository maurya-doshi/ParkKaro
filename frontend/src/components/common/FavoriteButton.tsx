import React, { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { favoritesApi } from '../../api/favorites';
import { useToast } from '../../context/ToastContext';

interface FavoriteButtonProps {
  listingId: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onToggle?: (isFav: boolean) => void;
}

export const FavoriteButton: React.FC<FavoriteButtonProps> = ({
  listingId,
  size = 'md',
  className = '',
  onToggle
}) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    let mounted = true;
    favoritesApi.isFavorite(listingId).then((fav) => {
      if (mounted) setIsFavorite(fav);
    });
    return () => {
      mounted = false;
    };
  }, [listingId]);

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (loading) return;
    setLoading(true);

    try {
      if (isFavorite) {
        await favoritesApi.remove(listingId);
        setIsFavorite(false);
        showToast('Removed from favorites', 'info');
        onToggle?.(false);
      } else {
        await favoritesApi.add(listingId);
        setIsFavorite(true);
        showToast('Saved to your favorites', 'success');
        onToggle?.(true);
      }
    } catch {
      showToast('Failed to update favorite', 'error');
    } finally {
      setLoading(false);
    }
  };

  const sizeClasses = {
    sm: 'w-7 h-7 p-1.5',
    md: 'w-9 h-9 p-2',
    lg: 'w-11 h-11 p-2.5'
  };

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4.5 h-4.5',
    lg: 'w-5.5 h-5.5'
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-label={isFavorite ? 'Remove from favorites' : 'Save to favorites'}
      className={`rounded-full flex items-center justify-center transition-all duration-200 backdrop-blur-md ${
        isFavorite
          ? 'bg-rose-50 text-rose-600 hover:bg-rose-100 shadow-sm'
          : 'bg-white/80 hover:bg-white text-slate-600 hover:text-rose-500 shadow-sm'
      } ${sizeClasses[size]} ${className}`}
    >
      <Heart
        className={`${iconSizes[size]} transition-transform duration-200 ${
          isFavorite ? 'fill-rose-500 text-rose-500 scale-110' : 'hover:scale-110'
        }`}
      />
    </button>
  );
};
