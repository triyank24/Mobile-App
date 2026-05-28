import React from 'react';
import { BsBook, BsJournalText, BsCameraVideo, BsLightbulb, BsPencil, BsCalculator } from 'react-icons/bs';

export default function BackgroundIcons() {
  return (
    <div className="global-floating-icons">
      <BsBook className="icon icon-global-1" />
      <BsJournalText className="icon icon-global-2" />
      <BsCameraVideo className="icon icon-global-3" />
      <BsLightbulb className="icon icon-global-4" />
      <BsPencil className="icon icon-global-5" />
      <BsCalculator className="icon icon-global-6" />
    </div>
  );
}
