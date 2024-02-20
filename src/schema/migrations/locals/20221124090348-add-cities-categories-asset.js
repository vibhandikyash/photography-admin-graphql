/* eslint-disable filenames-simple/naming-convention */
const assetsPath = {
  city: {
    Kolkata: 'assets/home-screen/cities/kolkata.png',
    Ahmedabad: 'assets/home-screen/cities/ahemdabad.png',
    Surat: 'assets/home-screen/cities/surat.png',
    Jaipur: 'assets/home-screen/cities/jaipur.png',
    Indore: 'assets/home-screen/cities/indore.png',
    Mumbai: 'assets/home-screen/cities/mumbai.png',
    Delhi: 'assets/home-screen/cities/delhi.png',
  },
  category: {
    PHOTOGRAPHER: 'assets/home-screen/categories/photographer.png',
    CINEMATOGRAPHER: 'assets/home-screen/categories/cinematographer.png',
    'CAMERA AND PHOTO GOODS': 'assets/home-screen/categories/photographer.png',
    'RENT- LED DISPLAY': 'assets/home-screen/categories/cinematographer.png',
    'TRADITIONAL PHOTOGRAPHER': 'assets/home-screen/categories/photographer.png',
    'PHOTO EDITOR': 'assets/home-screen/categories/photo-editor.png',
    'AERIAL CINEMATOGRAPHER': 'assets/home-screen/categories/aerial.png',
    'VIDEO EDITOR': 'assets/home-screen/categories/video-editor.png',
    'ALBUM DESIGNING AND PRINTING': 'assets/home-screen/categories/photographer.png',
  },
};

module.exports = {
  up: async queryInterface => {
    // for cities
    await queryInterface.sequelize.query(`
    update cities
    set asset_url  = case "name"
                       when 'Delhi' then '${assetsPath.city.Delhi}'
                       when 'Mumbai' then '${assetsPath.city.Mumbai}'
                       when 'Ahmedabad' then '${assetsPath.city.Ahmedabad}'
                       when 'Kolkata' then '${assetsPath.city.Kolkata}'
                       when 'Jaipur' then '${assetsPath.city.Jaipur}'
                       when 'Surat' then '${assetsPath.city.Surat}'
                       when 'Indore' then '${assetsPath.city.Indore}'
                       else asset_url
                       end
  where country_code='IN' and ("name" ='Delhi' or "name"='Mumbai'  or "name"='Ahmedabad'
  or "name"='Kolkata'  or "name"='Jaipur' or "name"='Surat'or "name"='Indore') and is_featured =true `);

    // for categories
    await queryInterface.sequelize.query(`
  update categories
  set url  = case "name"
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
    update cities
    set asset_url  = case "name"
                       when 'Delhi' THEN ''
                       when 'Mumbai' THEN ''
                       when 'Ahmedabad' THEN ''
                       when 'Kolkata' then ''
                       when 'Jaipur' then ''
                       when 'Surat' then ''
                       when 'Indore' then ''
                       else asset_url
                       end
   where country_code='IN' and ("name" ='Delhi' or "name"='Mumbai'  or "name"='Ahmedabad'
   or "name"='Kolkata'  or "name"='Jaipur' or "name"='Surat'or "name"='Indore') and is_featured =true`);

    await queryInterface.sequelize.query(`
   update categories
   set url  = CASE "name"
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
