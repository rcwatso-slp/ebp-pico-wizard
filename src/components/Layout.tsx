import React, { useState } from 'react';

interface LayoutProps {
  children: React.ReactNode;
  tips: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children, tips }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="appGrid">
      <main>{children}</main>
      <aside className="tipsDesktop">{tips}</aside>
      <section className="tipsMobile">
        <button className="accordionBtn" onClick={() => setOpen((v) => !v)}>
          {open ? 'Hide Tips' : 'Show Tips'}
        </button>
        {open ? <div className="accordionBody">{tips}</div> : null}
      </section>
    </div>
  );
};
