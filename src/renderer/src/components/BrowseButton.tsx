import React from 'react';

interface BrowseButtonProps {
  onClick: () => void;
}

export function BrowseButton({ onClick }: BrowseButtonProps) {
  return (
    <button type="button" className="browse-button" onClick={onClick}>
      <div className="browse-container">
        <div className="folder folder_one"></div>
        <div className="folder folder_two"></div>
        <div className="folder folder_three"></div>
        <div className="folder folder_four"></div>
      </div>
      <div className="active_line"></div>
      <span className="browse-text">File Explorer</span>
    </button>
  );
}