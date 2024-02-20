/* eslint-disable filenames-simple/naming-convention */
const assetsPath = {
  category: {
    PHOTOGRAPHER: 'assets/home-screen/categories/photographer.svg',
    CINEMATOGRAPHER: 'assets/home-screen/categories/cinematographer.svg',
    'CAMERA AND PHOTO GOODS': 'assets/home-screen/categories/photographer.svg',
    'RENT- LED DISPLAY': 'assets/home-screen/categories/cinematographer.svg',
    'TRADITIONAL PHOTOGRAPHER': 'assets/home-screen/categories/photographer.svg',
    'PHOTO EDITOR': 'assets/home-screen/categories/photo-editor.svg',
    'AERIAL CINEMATOGRAPHER': 'assets/home-screen/categories/aerial.svg',
    'VIDEO EDITOR': 'assets/home-screen/categories/video-editor.svg',
    'ALBUM DESIGNING AND PRINTING': 'assets/home-screen/categories/photographer.svg',
  },
};

module.exports = {
  up: async queryInterface => {
    await queryInterface.sequelize.query(`
    update categories set url  = case "name"
        when 'PHOTOGRAPHER' then '${assetsPath.category.PHOTOGRAPHER}'
        when 'CINEMATOGRAPHER' then '${assetsPath.category.CINEMATOGRAPHER}'
        when 'CAMERA AND PHOTO GOODS' then '${assetsPath.category['CAMERA AND PHOTO GOODS']}'
        when 'RENT- LED DISPLAY' THEN '${assetsPath.category['RENT- LED DISPLAY']}'
        when 'TRADITIONAL PHOTOGRAPHER' then '${assetsPath.category['TRADITIONAL PHOTOGRAPHER']}'
        when 'PHOTO EDITOR' then '${assetsPath.category['PHOTO EDITOR']}'
        when 'AERIAL CINEMATOGRAPHER' then '${assetsPath.category['AERIAL CINEMATOGRAPHER']}'
        when 'VIDEO EDITOR' then '${assetsPath.category['VIDEO EDITOR']}'
        when 'ALBUM DESIGNING AND PRINTING' then '${assetsPath.category['ALBUM DESIGNING AND PRINTING']}'
        when 'TRADITIONAL VIDEOGRAPHER' then '${assetsPath.category.CINEMATOGRAPHER}'
        else url
      end
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
    update categories set url  = CASE "name"
        when 'PHOTOGRAPHER' then ''
        when 'CINEMATOGRAPHER' then ''
        when 'CAMERA AND PHOTO GOODS' then ''
        when 'RENT- LED DISPLAY' then  ''
        when 'TRADITIONAL PHOTOGRAPHER' then ''
        when 'PHOTO EDITOR' then ''
        when 'AERIAL CINEMATOGRAPHER' then ''
        when 'VIDEO EDITOR' THEN ''
        when 'ALBUM DESIGNING AND PRINTING' then ''
        else url
      end
   `);
  },
};
