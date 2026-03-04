import { mergeToken } from '@ant-design/cssinjs-utils';
import { genCollapseMotion } from '../../style';
import { genStyleHooks } from '../../theme/genStyleUtils';
import type { FullToken, GenerateStyle, GetDefaultToken } from '../../theme/interface';

export interface ComponentToken {
  /**
   * @desc 文件夹图标颜色
   * @descEN Folder icon color
   */
  colorIconFolder: string;
  /**
   * @desc 文件图标颜色
   * @descEN File icon color
   */
  colorIconFile: string;
  /**
   * @desc 选中项背景色
   * @descEN Selected item background color
   */
  colorBgSelected: string;
  /**
   * @desc 悬停项背景色
   * @descEN Hover item background color
   */
  colorBgHover: string;
}

export interface FolderToken extends FullToken<'Folder'> {}

const genFolderStyle: GenerateStyle<FolderToken> = (token) => {
  const {
    componentCls,
    paddingXS,
    marginSM,
    colorText,
    colorTextSecondary,
    colorBorder,
    lineWidth,
    borderRadius,
    calc,
    colorPrimary,
    colorFillSecondary,
    fontSize,
    lineHeight,
  } = token;

  return {
    [componentCls]: {
      [`${componentCls}-title`]: {
        fontSize: fontSize,
        fontWeight: 500,
        color: colorText,
        marginBottom: marginSM,
      },

      [`${componentCls}-content`]: {
        width: '100%',
      },

      [`${componentCls}-item`]: {
        display: 'block',
        cursor: 'pointer',
        borderRadius: borderRadius,
        transition: `background-color ${token.motionDurationMid}`,

        [`${componentCls}-item-content`]: {
          display: 'flex',
          alignItems: 'center',
          padding: `${calc(paddingXS).div(2).equal()} ${paddingXS}`,
          gap: paddingXS,
        },

        [`${componentCls}-item-icon`]: {
          fontSize: fontSize,
          display: 'flex',
          alignItems: 'center',
          color: colorTextSecondary,
        },

        [`${componentCls}-item-title`]: {
          fontSize: fontSize,
          color: colorText,
          lineHeight: lineHeight,
        },

        [`&${componentCls}-item-folder`]: {
          [`${componentCls}-item-icon`]: {
            color: '#faad14',
          },
        },

        [`&${componentCls}-item-file`]: {
          [`${componentCls}-item-icon`]: {
            color: colorTextSecondary,
          },
        },

        [`&${componentCls}-item-selected`]: {
          backgroundColor: colorPrimary,

          [`${componentCls}-item-title`]: {
            color: colorText,
            fontWeight: 500,
          },
        },

        [`&:hover:not(${componentCls}-item-selected)`]: {
          backgroundColor: colorFillSecondary,
        },

        [`${componentCls}-item-children`]: {
          paddingLeft: calc(fontSize).add(paddingXS).equal(),
          borderLeft: `${lineWidth} solid ${colorBorder}`,
          marginLeft: calc(fontSize).div(2).add(calc(paddingXS).div(2).equal()).equal(),
        },
      },

      [`&${componentCls}-rtl`]: {
        direction: 'rtl',

        [`${componentCls}-item-children`]: {
          paddingLeft: 0,
          paddingRight: calc(fontSize).add(paddingXS).equal(),
          borderLeft: 'none',
          borderRight: `${lineWidth} solid ${colorBorder}`,
          marginLeft: 0,
          marginRight: calc(fontSize).div(2).add(calc(paddingXS).div(2).equal()).equal(),
        },
      },
    },
  };
};

// FileTree styles
const genFileTreeStyle: GenerateStyle<FolderToken> = (token) => {
  const { componentCls } = token;
  const fileTreeCls = componentCls.replace('folder', 'file-tree');

  return {
    [fileTreeCls]: {
      display: 'flex',
      gap: token.margin,
      height: '100%',

      [`${fileTreeCls}-tree-container`]: {
        flex: '0 0 300px',
        minWidth: 200,
        maxWidth: 400,
        borderRight: `${token.lineWidth} solid ${token.colorBorder}`,
        paddingRight: token.padding,
      },

      [`${fileTreeCls}-preview-container`]: {
        flex: 1,
        minWidth: 0,
      },

      [`${fileTreeCls}-with-preview`]: {
        [`${fileTreeCls}-tree-container`]: {
          borderRight: `${token.lineWidth} solid ${token.colorBorder}`,
        },
      },

      // 加载状态
      [`${fileTreeCls}-loading-container`]: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: 200,
      },

      // 错误状态
      [`${fileTreeCls}-error-container`]: {
        padding: token.padding * 2,
      },

      // 空状态
      [`${fileTreeCls}-empty-container`]: {
        padding: token.padding * 2,
      },

      // 预览头部
      [`${fileTreeCls}-header`]: {
        padding: `${token.padding}px ${token.padding}px`,
        borderBottom: `${token.lineWidth} solid ${token.colorBorder}`,
        backgroundColor: token.colorFillQuaternary,
      },

      [`${fileTreeCls}-title`]: {
        fontSize: token.fontSize,
        fontWeight: 500,
        color: token.colorText,
      },

      [`${fileTreeCls}-content`]: {
        height: 'calc(100% - 48px)',
        overflow: 'auto',
      },
    },
  };
};

// FilePreview styles
const genFilePreviewStyle: GenerateStyle<FolderToken> = (token) => {
  const { componentCls } = token;
  const filePreviewCls = componentCls.replace('folder', 'folder-preview');

  return {
    [filePreviewCls]: {
      height: '100%',
      display: 'flex',
      flexDirection: 'column',

      [`${filePreviewCls}-header`]: {
        padding: `${token.padding}px ${token.padding}px`,
        borderBottom: `${token.lineWidth} solid ${token.colorBorder}`,
        backgroundColor: token.colorFillQuaternary,
        flexShrink: 0,
      },

      [`${filePreviewCls}-title`]: {
        fontSize: token.fontSize,
        fontWeight: 500,
        color: token.colorText,
      },

      [`${filePreviewCls}-content`]: {
        flex: 1,
        overflow: 'auto',
        padding: token.padding,
      },

      [`${filePreviewCls}-loading-container`]: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: 200,
      },

      [`${filePreviewCls}-error-container`]: {
        padding: token.padding * 2,
      },

      [`${filePreviewCls}-empty-container`]: {
        padding: token.padding * 2,
      },
    },
  };
};

export const prepareComponentToken: GetDefaultToken<'Folder'> = (token) => {
  const { colorTextSecondary, colorPrimary, colorFillSecondary } = token;

  return {
    colorIconFolder: '#faad14',
    colorIconFile: colorTextSecondary,
    colorBgSelected: colorPrimary,
    colorBgHover: colorFillSecondary,
  };
};

export default genStyleHooks<'Folder'>(
  'Folder',
  (token) => {
    const compToken = mergeToken<FolderToken>(token, {});

    return [
      genFolderStyle(compToken),
      genFileTreeStyle(compToken),
      genFilePreviewStyle(compToken),
      genCollapseMotion(compToken),
    ];
  },
  prepareComponentToken,
);
