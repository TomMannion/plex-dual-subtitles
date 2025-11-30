/**
 * Tabs — Tab navigation primitive
 *
 * Hard-edged tab component for switching content.
 * Brutalist styling with no rounded corners.
 */

import {
  forwardRef,
  createContext,
  useContext,
  useState,
  type ReactNode,
  type HTMLAttributes,
} from 'react';
import clsx from 'clsx';

interface TabsContextValue {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const TabsContext = createContext<TabsContextValue | null>(null);

const useTabsContext = () => {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('Tab components must be used within a Tabs provider');
  }
  return context;
};

export interface TabsProps extends HTMLAttributes<HTMLDivElement> {
  defaultTab?: string;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  children: ReactNode;
}

const Tabs = forwardRef<HTMLDivElement, TabsProps>(
  ({ defaultTab = '', activeTab: controlledTab, onTabChange, children, className, ...props }, ref) => {
    const [internalTab, setInternalTab] = useState(defaultTab);

    const activeTab = controlledTab !== undefined ? controlledTab : internalTab;
    const setActiveTab = (tab: string) => {
      if (controlledTab === undefined) {
        setInternalTab(tab);
      }
      onTabChange?.(tab);
    };

    const classes = clsx('tabs-brutal', className);

    return (
      <TabsContext.Provider value={{ activeTab, setActiveTab }}>
        <div ref={ref} className={classes} {...props}>
          {children}
        </div>
      </TabsContext.Provider>
    );
  }
);

Tabs.displayName = 'Tabs';

// Tab List
export interface TabListProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

const TabList = forwardRef<HTMLDivElement, TabListProps>(
  ({ children, className, ...props }, ref) => {
    const classes = clsx('tabs-brutal-list', className);

    return (
      <div ref={ref} className={classes} role="tablist" {...props}>
        {children}
      </div>
    );
  }
);

TabList.displayName = 'Tabs.List';

// Tab Trigger
export interface TabProps extends HTMLAttributes<HTMLButtonElement> {
  value: string;
  disabled?: boolean;
  children: ReactNode;
}

const Tab = forwardRef<HTMLButtonElement, TabProps>(
  ({ value, disabled, children, className, ...props }, ref) => {
    const { activeTab, setActiveTab } = useTabsContext();
    const isActive = activeTab === value;

    const classes = clsx(
      'tabs-brutal-tab',
      isActive && 'tabs-brutal-tab-active',
      disabled && 'tabs-brutal-tab-disabled',
      className
    );

    return (
      <button
        ref={ref}
        type="button"
        role="tab"
        className={classes}
        aria-selected={isActive}
        disabled={disabled}
        onClick={() => !disabled && setActiveTab(value)}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Tab.displayName = 'Tabs.Tab';

// Tab Panel
export interface TabPanelProps extends HTMLAttributes<HTMLDivElement> {
  value: string;
  children: ReactNode;
}

const TabPanel = forwardRef<HTMLDivElement, TabPanelProps>(
  ({ value, children, className, ...props }, ref) => {
    const { activeTab } = useTabsContext();

    if (activeTab !== value) return null;

    const classes = clsx('tabs-brutal-panel', className);

    return (
      <div ref={ref} role="tabpanel" className={classes} {...props}>
        {children}
      </div>
    );
  }
);

TabPanel.displayName = 'Tabs.Panel';

export { Tabs, TabList, Tab, TabPanel };
