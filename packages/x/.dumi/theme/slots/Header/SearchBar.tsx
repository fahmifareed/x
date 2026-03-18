import { SearchOutlined } from '@ant-design/icons';
import { css, Global } from '@emotion/react';
import { createStyles, useTheme } from 'antd-style';
import { clsx } from 'clsx';
import DumiSearchBar from 'dumi/theme-default/slots/SearchBar';
import * as React from 'react';

const useStyle = createStyles(({ token, css }) => ({
  container: css`
    display: flex;
    align-items: center;
    margin-inline-end: -10px;
  `,
  iconBtn: css`
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: ${token.borderRadiusLG}px;
    color: ${token.colorTextSecondary};
    font-size: 15px;
    flex-shrink: 0;
    transition:
      color 0.2s,
      background 0.2s,
      opacity 0.25s,
      width 0.3s;

    &:hover {
      color: ${token.colorText};
      background: rgba(255, 255, 255, 0.12);
    }
  `,
  iconBtnVisible: css`
    width: 32px;
    height: 32px;
    opacity: 1;
    pointer-events: auto;
  `,
  iconBtnHidden: css`
    width: 0;
    height: 32px;
    opacity: 0;
    pointer-events: none;
  `,
  searchWrapper: css`
    width: 0;
    opacity: 0;
    flex-shrink: 0;
    transition:
      width 0.3s ease,
      opacity 0.3s ease;
  `,
  searchWrapperExpanded: css`
    width: 200px;
    opacity: 1;
  `,
}));

const SearchGlobalStyle: React.FC = () => {
  const token = useTheme();
  return (
    <Global
      styles={css`
        .dumi-default-search-shortcut {
          display: none !important;
        }
        .dumi-default-search-bar:not(:last-child) {
          margin-inline-end: 0 !important;
        }
        .dumi-default-search-bar-input {
          width: 100% !important;
          height: 32px !important;
          border-radius: 16px !important;
          background: rgba(255, 255, 255, 0.08) !important;
          border-color: rgba(255, 255, 255, 0.2) !important;
          color: ${token.colorText} !important;
          font-size: 13px !important;
          padding-inline-end: 12px !important;
          transition:
            background 0.2s,
            border-color 0.2s,
            box-shadow 0.2s !important;

          &::placeholder {
            color: ${token.colorTextTertiary} !important;
          }

          &:focus {
            background: ${token.colorBgElevated} !important;
            border-color: rgba(255, 255, 255, 0.45) !important;
            box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.1) !important;
          }
        }
        .dumi-default-search-bar-svg {
          fill: ${token.colorTextTertiary} !important;
        }
        .dumi-default-search-popover {
          inset-inline-start: 0 !important;
          inset-inline-end: auto !important;

          &::before {
            inset-inline-start: 92px !important;
            inset-inline-end: auto !important;
          }
        }
      `}
    />
  );
};

export interface SearchBarProps {
  isMobile: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({ isMobile }) => {
  const { styles } = useStyle();
  const wrapperRef = React.useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = React.useState(false);

  React.useEffect(() => {
    if (expanded && !isMobile) {
      requestAnimationFrame(() => {
        const input = wrapperRef.current?.querySelector('input');
        input?.focus();
      });
    }
  }, [expanded, isMobile]);

  const handleBlur = () => {
    setTimeout(() => {
      if (wrapperRef.current && !wrapperRef.current.contains(document.activeElement)) {
        setExpanded(false);
      }
    }, 150);
  };

  if (isMobile) return null;

  return (
    <>
      <SearchGlobalStyle />
      <div className={styles.container}>
        <span
          className={clsx(styles.iconBtn, expanded ? styles.iconBtnHidden : styles.iconBtnVisible)}
          onClick={() => setExpanded(true)}
        >
          <SearchOutlined />
        </span>
        <div
          ref={wrapperRef}
          className={clsx(styles.searchWrapper, expanded && styles.searchWrapperExpanded)}
          onBlur={handleBlur}
        >
          <DumiSearchBar />
        </div>
      </div>
    </>
  );
};

export default SearchBar;
