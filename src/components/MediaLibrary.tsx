import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Box, IconButton, Dialog, Paper, Button, Typography, useTheme, Fade, Checkbox, CircularProgress } from '@mui/material';
import { keyframes } from '@mui/system';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import ShareIcon from '@mui/icons-material/Share';
import SaveIcon from '@mui/icons-material/Save';
import EditIcon from '@mui/icons-material/Edit';
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';
import WarningIcon from '@mui/icons-material/Warning';
import SelectAllIcon from '@mui/icons-material/SelectAll';
import DownloadIcon from '@mui/icons-material/Download';
import FolderZipIcon from '@mui/icons-material/FolderZip';

const DELETE_ANIMATION_DURATION = 320;

const deleteScaleFade = keyframes`
  0% {
    opacity: 1;
    transform: scale(1);
    filter: blur(0px);
  }
  60% {
    opacity: 0.35;
    transform: scale(0.88);
    filter: blur(1px);
  }
  100% {
    opacity: 0;
    transform: scale(0.72);
    filter: blur(2px);
  }
`;

interface MediaItem {
  id: string;
  url: string;
  type: 'image' | 'video';
  timestamp: number;
}

interface ParallaxMediaItemProps {
  item: MediaItem;
  index: number;
  scrollY: number;
  onSave: () => void;
  onEdit: () => void;
  onShare: () => void;
  onDelete: (e: React.MouseEvent<HTMLElement>) => void;
  isDeleting?: boolean;
  isSelected?: boolean;
  onSelect?: () => void;
  selectMode?: boolean;
  onLoadUrl?: () => void;
}

const ParallaxMediaItem: React.FC<ParallaxMediaItemProps> = ({ 
  item, index, scrollY, onSave, onEdit, onShare, onDelete, isDeleting = false, isSelected = false, onSelect, selectMode = false, onLoadUrl
}) => {
  const theme = useTheme();
  const parallaxOffset = (scrollY * 0.1) * (index % 3 === 0 ? 1 : index % 3 === 1 ? 0.7 : 0.4);
  const ref = useRef<HTMLDivElement>(null);

  // Lazy-load URL when item becomes visible
  useEffect(() => {
    if (!ref.current || item.url) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) {
        onLoadUrl?.();
        observer.disconnect();
      }
    }, { rootMargin: '100px' });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [item.url, onLoadUrl]);
  
  return (
    <Box 
      ref={ref}
      data-media-item
      onClick={selectMode ? onSelect : undefined}
       sx={{ 
         position: 'relative', 
         aspectRatio: '1', 
         bgcolor: 'black', 
         borderRadius: 2, 
         overflow: 'hidden',
         transition: 'transform 0.3s ease, box-shadow 0.3s ease',
         animation: isDeleting ? `${deleteScaleFade} ${DELETE_ANIMATION_DURATION}ms ease forwards` : undefined,
         pointerEvents: isDeleting ? 'none' : 'auto',
         cursor: selectMode ? 'pointer' : 'default',
         outline: isSelected ? `3px solid ${theme.palette.primary.main}` : 'none',
         '&:hover': {
           transform: 'scale(1.03)',
           boxShadow: `0 8px 24px ${theme.palette.primary.main}33`,
           '& .media-overlay': { opacity: selectMode ? 0 : 1 },
           '& .media-content': { transform: 'scale(1.1)' },
         },
       }}
     >
      {selectMode && (
        <Checkbox 
          checked={isSelected} 
          sx={{ position: 'absolute', top: 4, right: 4, zIndex: 10, color: 'white', '&.Mui-checked': { color: 'primary.main' } }}
          onClick={(e) => { e.stopPropagation(); onSelect?.(); }}
        />
      )}

      <Box 
        className="media-content"
        sx={{ 
          width: '100%', 
          height: '100%',
          transform: `translateY(${parallaxOffset}px)`,
          transition: 'transform 0.4s ease-out',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {!item.url ? (
          <CircularProgress size={24} />
        ) : item.type === 'image' ? (
          <img src={item.url} alt={`Captured photo from ${new Date(item.timestamp).toLocaleString()}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <video src={item.url} preload="metadata" aria-label={`Captured video from ${new Date(item.timestamp).toLocaleString()}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        )}
      </Box>
      
      <Box 
        className="media-overlay"
        sx={{ 
          position: 'absolute', 
          inset: 0,
          background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 50%)',
          opacity: 0,
          transition: 'opacity 0.3s ease',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-around', p: 1 }}>
          <IconButton size="small" onClick={onSave} sx={{ color: 'white' }} aria-label="Save media">
            <SaveIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={onEdit} sx={{ color: 'white' }} aria-label="Edit media">
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={onShare} sx={{ color: 'white' }} aria-label="Share media">
            <ShareIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={onDelete} sx={{ color: 'error.main' }} aria-label="Delete media">
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>
      
      <Box 
        sx={{ 
          position: 'absolute', 
          top: 8, 
          left: 8, 
          px: 1, 
          py: 0.25,
          borderRadius: 1,
          bgcolor: item.type === 'video' ? 'error.main' : 'primary.main',
          fontSize: 10,
          fontWeight: 'bold',
          color: 'white',
          textTransform: 'uppercase',
        }}
      >
        {item.type}
      </Box>
    </Box>
  );
};

interface MediaLibraryProps {
  items: MediaItem[];
  onClose?: () => void;
  onDelete: (id: string) => void;
  loadItemUrl?: (id: string) => Promise<string>;
  mode?: 'dialog' | 'panel';
}

export const MediaLibrary: React.FC<MediaLibraryProps> = ({ items, onClose, onDelete, loadItemUrl, mode = 'dialog' }) => {
  const theme = useTheme();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollY, setScrollY] = useState(0);
  const [deleteConfirm, setDeleteConfirm] = useState<{open: boolean, id: string | null, url: string | null, type?: 'image' | 'video', anchorEl: HTMLElement | null}>({open: false, id: null, url: null, anchorEl: null});
  const [deletingIds, setDeletingIds] = useState<string[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectMode, setSelectMode] = useState(false);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => setSelectedIds(new Set(items.map(i => i.id)));
  const clearSelection = () => { setSelectedIds(new Set()); setSelectMode(false); };

  const deleteSelected = () => {
    selectedIds.forEach(id => {
      setDeletingIds(prev => [...prev, id]);
      setTimeout(() => {
        onDelete(id);
        setDeletingIds(prev => prev.filter(i => i !== id));
      }, DELETE_ANIMATION_DURATION);
    });
    clearSelection();
  };

  const getSelectedItems = () => items.filter(i => selectedIds.has(i.id));

  const downloadAll = async () => {
    const selected = getSelectedItems();
    try {
      for (const item of selected) {
        const a = document.createElement('a');
        a.href = item.url;
        a.download = `lumina_${item.type}_${item.timestamp}.${item.type === 'image' ? 'png' : 'webm'}`;
        a.click();
        await new Promise(r => setTimeout(r, 100));
      }
    } catch (e) {
      console.error('Download failed', e);
    }
  };

  const downloadAsZip = async () => {
    const selected = getSelectedItems();
    try {
      const { default: JSZip } = await import('jszip');
      const zip = new JSZip();
      
      for (const item of selected) {
        const response = await fetch(item.url);
        const blob = await response.blob();
        const ext = item.type === 'image' ? 'png' : 'webm';
        zip.file(`lumina_${item.type}_${item.timestamp}.${ext}`, blob);
      }
      
      const content = await zip.generateAsync({ type: 'blob' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(content);
      a.download = `lumia_media_${Date.now()}.zip`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (e) {
      console.error('Zip download failed', e);
    }
  };

  const shareSelected = async () => {
    const selected = getSelectedItems();
    try {
      const files = await Promise.all(selected.map(async item => {
        const response = await fetch(item.url);
        const blob = await response.blob();
        return new File([blob], `lumina_${item.type}_${item.timestamp}.${item.type === 'image' ? 'png' : 'webm'}`, { type: blob.type });
      }));
      
      if (navigator.share && navigator.canShare({ files })) {
        await navigator.share({ files, title: 'Lumia Pro Media' });
      } else {
        downloadAll();
      }
    } catch (e) {
      console.error('Share failed', e);
    }
  };

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollY(e.currentTarget.scrollTop);
  }, []);

  const handleDeleteClick = (item: MediaItem, event: React.MouseEvent<HTMLElement>) => {

    const target = event.currentTarget.closest('[data-media-item]') as HTMLElement;
    setDeleteConfirm({open: true, id: item.id, url: item.url, type: item.type, anchorEl: target});
  };
  
  const handleDeleteConfirm = () => {
    if (!deleteConfirm.id) {
      setDeleteConfirm({open: false, id: null, url: null, anchorEl: null});
      return;
    }

    const targetId = deleteConfirm.id;
    if (!deletingIds.includes(targetId)) {
      setDeletingIds((prev) => [...prev, targetId]);
    }

    setTimeout(() => {
      onDelete(targetId);
      setDeletingIds((prev) => prev.filter((id) => id !== targetId));
    }, DELETE_ANIMATION_DURATION);

    setDeleteConfirm({open: false, id: null, url: null, anchorEl: null});
  };

  const handleSave = (item: MediaItem) => {
    const a = document.createElement('a');
    a.href = item.url;
    a.download = `lumina_${item.type}_${item.timestamp}.${item.type === 'image' ? 'png' : 'webm'}`;
    a.click();
  };

  const handleShare = async (item: MediaItem) => {
    try {
      const response = await fetch(item.url);
      const blob = await response.blob();
      const file = new File([blob], `lumina_${item.type}_${item.timestamp}.${item.type === 'image' ? 'png' : 'webm'}`, { type: blob.type });
      
      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file] });
      } else {
        handleSave(item);
      }
    } catch (e) {
      console.error('Share failed', e);
    }
  };

  const handleEdit = (item: MediaItem) => {
    window.open(item.url, '_blank');
  };

  const content = (
    <Box 
      ref={scrollRef}
      onScroll={handleScroll}
      sx={{ 
        height: '100%',
        overflowY: 'auto',
        p: 2,
        position: 'relative',
      }}
    >
      {/* Inline Delete Confirmation */}
      <Fade in={deleteConfirm.open}>
        <Paper
          elevation={8}
          sx={{
            position: 'absolute',
            top: deleteConfirm.anchorEl ? `${deleteConfirm.anchorEl.offsetTop + deleteConfirm.anchorEl.offsetHeight / 2}px` : '50%',
            left: deleteConfirm.anchorEl ? `${deleteConfirm.anchorEl.offsetLeft + deleteConfirm.anchorEl.offsetWidth / 2}px` : '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 100,
            p: 2,
            borderRadius: 3,
            bgcolor: 'background.paper',
            textAlign: 'center',
            minWidth: 200,
            display: deleteConfirm.open ? 'block' : 'none',
          }}
        >
          <WarningIcon sx={{ fontSize: 32, color: 'error.main', mb: 1 }} />
          <Typography variant="body2" fontWeight="bold" gutterBottom>Delete?</Typography>
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', mt: 1 }}>
            <Button size="small" onClick={() => setDeleteConfirm({open: false, id: null, url: null, anchorEl: null})} variant="outlined">Cancel</Button>
            <Button size="small" onClick={handleDeleteConfirm} color="error" variant="contained">Delete</Button>
          </Box>
        </Paper>
      </Fade>

      {/* Backdrop when delete confirm is open */}
      {deleteConfirm.open && (
        <Box 
          onClick={() => setDeleteConfirm({open: false, id: null, url: null, anchorEl: null})}
          sx={{ position: 'absolute', inset: 0, bgcolor: 'rgba(0,0,0,0.5)', zIndex: 99 }} 
        />
      )}

      {/* Parallax Header */}
      <Box
        sx={{
          position: 'relative',
          height: 100,
          borderRadius: 3,
          mb: 3,
          background: `linear-gradient(135deg, ${theme.palette.primary.main}33, ${theme.palette.secondary.main}33)`,
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            overflow: 'hidden',
            borderRadius: 3,
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              transform: `translateY(${scrollY * 0.4}px)`,
              background: `radial-gradient(circle at 30% 50%, ${theme.palette.primary.main}44 0%, transparent 60%)`,
              transition: 'transform 0.1s ease-out',
            }}
          />
        </Box>
        <Box
          sx={{
            position: 'relative',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            px: 2,
            gap: 2,
            transform: `translateY(${-scrollY * 0.2}px)`,
            opacity: Math.max(0, 1 - scrollY / 100),
            transition: 'transform 0.1s ease-out, opacity 0.1s ease-out',
          }}
        >
          <PhotoLibraryIcon id="media-library-icon" sx={{ fontSize: 40, color: theme.palette.primary.main }} />
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" fontWeight="bold">Media Library</Typography>
            <Typography variant="caption" color="text.secondary">
              {items.length} {items.length === 1 ? 'item' : 'items'}
              {selectedIds.size > 0 && ` • ${selectedIds.size} selected`}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Selection Controls - Outside header for visibility */}
      {items.length > 0 && (
        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
          {selectMode ? (
            <>
              <Button size="small" variant="outlined" onClick={selectAll} startIcon={<SelectAllIcon />}>Select All</Button>
              <Button size="small" variant="outlined" onClick={clearSelection}>Cancel</Button>
              {selectedIds.size > 0 && (
                <>
                  <Button size="small" variant="contained" color="error" onClick={deleteSelected} startIcon={<DeleteIcon />}>
                    Delete ({selectedIds.size})
                  </Button>
                  <Button size="small" variant="contained" onClick={downloadAll} startIcon={<DownloadIcon />}>
                    Download
                  </Button>
                  <Button size="small" variant="outlined" onClick={downloadAsZip} startIcon={<FolderZipIcon />}>
                    ZIP
                  </Button>
                  <Button size="small" variant="outlined" onClick={shareSelected} startIcon={<ShareIcon />}>
                    Share
                  </Button>
                </>
              )}
            </>
          ) : (
            <Button size="small" variant="outlined" onClick={() => setSelectMode(true)}>Select</Button>
          )}
        </Box>
      )}

      {items.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
          <PhotoLibraryIcon sx={{ fontSize: 64, opacity: 0.3, mb: 2 }} />
          <Typography>No media captured yet</Typography>
          <Typography variant="caption">Photos and videos will appear here</Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 2 }}>
          {items.map((item, index) => (
            <ParallaxMediaItem
              key={item.id}
              item={item}
              index={index}
              scrollY={scrollY}
              onSave={() => handleSave(item)}
              onEdit={() => handleEdit(item)}
              onShare={() => handleShare(item)}
              onDelete={(e) => handleDeleteClick(item, e)}
              isDeleting={deletingIds.includes(item.id)}
              isSelected={selectedIds.has(item.id)}
              onSelect={() => toggleSelect(item.id)}
              selectMode={selectMode}
              onLoadUrl={loadItemUrl ? () => loadItemUrl(item.id) : undefined}
            />
          ))}
        </Box>
      )}
    </Box>
  );


  if (mode === 'panel') {
    return content;
  }

  return (
    <Dialog open={true} onClose={onClose} maxWidth="md" fullWidth>
      <Box sx={{ position: 'relative', bgcolor: 'background.default', height: '70vh' }}>
        <IconButton onClick={onClose} sx={{ position: 'absolute', right: 8, top: 8, zIndex: 1 }}>
          <CloseIcon />
        </IconButton>
        {content}
      </Box>
    </Dialog>
  );
};
