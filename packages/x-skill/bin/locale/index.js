// 添加表情符号
export const emojis = {
  rocket: '🚀',
  package: '📦',
  sparkles: '✨',
  check: '✅',
  cross: '❌',
  warning: '⚠️',
  info: '💡',
  party: '🎉',
  star: '⭐',
  heart: '❤️',
  magic: '✨',
  folder: '📁',
  gear: '⚙️',
  computer: '💻',
  globe: '🌍',
  bulb: '💡',
};

export const messages = {
  zh: {
    welcome: `${emojis.rocket} 欢迎使用 X-Skill 安装器！`,
    welcomeSub: '我们将帮你快速安装所需的开发技能！',
    selectLanguage: `${emojis.globe} 请选择语言 / Please select language:`,
    selectLanguagePrompt: '请选择语言 / Please select language (输入数字/enter number)',
    selectSkills: `请选择要安装的技能 (可多选):`,
    selectSoftware: `${emojis.computer} 请选择目标软件 (可多选):`,
    selectInstallType: `${emojis.gear} 请选择安装方式:`,
    installComplete: `${emojis.party} 安装完成! 太棒了！`,
    installFailed: `${emojis.cross} 安装失败:`,
    globalInstall: '🌍 全局安装',
    projectInstall: '📁 项目安装',
    installingSkill: `${emojis.package} 正在为 {software} 安装技能...`,
    updatingSkill: `${emojis.info} 更新已存在的技能: {skill}`,
    installingDetail: `${emojis.check} {skill} -> {path}`,
    installError: `${emojis.cross} 安装 {skill} 失败: {error}`,
    goodbye: `${emojis.heart}  再见！祝你开发愉快！`,
    invalidChoice: '无效选择，请重试',
    noSelection: '请至少选择一个选项',
    yourChoice: '你选择了:',
    pleaseSelect: '请选择:',
    pleaseSelectNumber: '请选择 (输入数字):',
    allComplete: '所有安装任务完成！',
    startUsing: '你可以开始使用新安装的技能了！',
    // 新增国际化配置
    error: '错误',
    warning: '警告',
    info: '提示',
    success: '成功',
    cancel: '取消',
    operationCanceled: '操作已取消',
    nonInteractiveEnv: '非交互式环境',
    readlineClosed: 'Readline interface is closed',
    stdoutNotTTY: 'stdout不是交互式终端',
    inputEnded: '输入流意外结束',
    inputEmpty: '输入不能为空，请重试',
    invalidInput: '无效输入，请重试',
    maxAttemptsExceeded: '多次输入失败，程序终止',
    programInterrupted: '程序被意外中断',

    // 网络和加载相关
    fetchingSkills: '正在从GitHub获取技能列表...',
    fetchingVersions: '获取可用版本...',
    usingLocalSkills: '正在使用本地技能文件...',
    noLocalSkills: '本地也没有找到可用的技能',
    noSkillsFound: '没有找到可用的技能',
    noSoftwareFound: '没有找到可用的软件目标',
    noVersionsFound: '没有找到版本标签',

    // GitHub API 相关
    rateLimitError: 'GitHub API 速率限制: {message}',
    rateLimitHint: '设置 GITHUB_TOKEN 环境变量可提高限制到每小时5000次',
    githubFetchError: '从GitHub获取技能失败: {message}',

    // 文件和配置相关
    configLoadError: '加载技能配置失败: {message}',
    localeLoadError: '加载语言配置失败: {message}',
    versionReadError: '读取版本失败: {message}',

    // 交互提示
    selectAtLeastOneSkill: '请至少选择一个技能',
    selectAtLeastOneSoftware: '请至少选择一个软件目标',
    inputNumberTip: '输入数字编号，如: 1',
    inputMultipleTip: '输入数字编号，多个选择用逗号分隔，如: 1,2,3',

    // 帮助信息
    usage: '用法',
    options: '选项',
    examples: '示例',
    environmentVariables: '环境变量',

    // 版本和标签
    usingVersion: '使用版本: {version}',
    latestMarker: ' (latest)',
    availableVersions: '可用版本:',

    // 安装过程
    installationProgress: '  :bar :percent :current/:total :etas → :text',
    installationFailed: '(失败)',
  },
  en: {
    welcome: `${emojis.rocket} Welcome to X-Skill Installer!`,
    welcomeSub: 'We will help you quickly install the required development skills!',
    selectLanguage: `${emojis.globe} Select language / 请选择语言:`,
    selectLanguagePrompt: 'Please select language / 请选择语言 (enter number/输入数字)',
    selectSkills: `${emojis.magic} Select skills to install (multiple selection):`,
    selectSoftware: `${emojis.computer} Select target software (multiple selection):`,
    selectInstallType: `${emojis.gear} Select installation type:`,
    installComplete: `${emojis.party} Installation complete! Awesome!`,
    installFailed: `${emojis.cross} Installation failed:`,
    globalInstall: '🌍 Global install',
    projectInstall: '📁 Project install',
    installingSkill: `${emojis.package} Installing skills for {software}...`,
    updatingSkill: `${emojis.info} Updating existing skill: {skill}`,
    installingDetail: `${emojis.check} {skill} -> {path}`,
    installError: `${emojis.cross} Failed to install {skill}: {error}`,
    goodbye: `${emojis.heart}  Goodbye! Happy coding!`,
    invalidChoice: 'Invalid choice, please try again',
    noSelection: 'Please select at least one option',
    yourChoice: 'You selected:',
    pleaseSelect: 'Please select:',
    pleaseSelectNumber: 'Please select (enter number):',
    allComplete: 'All installation tasks completed!',
    startUsing: 'You can start using your newly installed skills!',
    // 新增国际化配置
    error: 'Error',
    warning: 'Warning',
    info: 'Info',
    success: 'Success',
    cancel: 'Cancel',
    operationCanceled: 'Operation canceled',
    nonInteractiveEnv: 'Non-interactive environment',
    readlineClosed: 'Readline interface is closed',
    stdoutNotTTY: 'stdout is not interactive terminal',
    inputEnded: 'Input stream ended unexpectedly',
    inputEmpty: 'Input cannot be empty, please try again',
    invalidInput: 'Invalid input, please try again',
    maxAttemptsExceeded: 'Maximum attempts exceeded, program terminated',
    programInterrupted: 'Program interrupted unexpectedly',

    // 网络和加载相关
    fetchingSkills: 'Fetching skills from GitHub...',
    fetchingVersions: 'Fetching available versions...',
    usingLocalSkills: 'Using local skills...',
    noLocalSkills: 'No local skills found',
    noSkillsFound: 'No available skills found',
    noSoftwareFound: 'No available software targets found',
    noVersionsFound: 'No version tags found',

    // GitHub API 相关
    rateLimitError: 'GitHub API rate limit: {message}',
    rateLimitHint: 'Set GITHUB_TOKEN environment variable to increase limit to 5000 per hour',
    githubFetchError: 'Failed to fetch skills from GitHub: {message}',

    // 文件和配置相关
    configLoadError: 'Failed to load skill config: {message}',
    localeLoadError: 'Failed to load locale messages: {message}',
    versionReadError: 'Failed to read version: {message}',

    // 交互提示
    selectAtLeastOneSkill: 'Please select at least one skill',
    selectAtLeastOneSoftware: 'Please select at least one software target',
    inputNumberTip: 'Enter number, e.g., 1',
    inputMultipleTip: 'Enter numbers separated by commas, e.g., 1,2,3',

    // 帮助信息
    usage: 'Usage',
    options: 'Options',
    examples: 'Examples',
    environmentVariables: 'Environment Variables',

    // 版本和标签
    usingVersion: 'Using version: {version}',
    latestMarker: ' (latest)',
    availableVersions: 'Available versions:',

    // 安装过程
    installationProgress: '  :bar :percent :current/:total :etas → :text',
    installationFailed: '(failed)',
  },
};
