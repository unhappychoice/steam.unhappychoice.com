const attachStoreData = (games) =>
  Promise.all([Promise.all(chunk(games, 100).map(fetchStoreItems)), fetchTagNames()])
    .then(([results, tagNames]) => [Object.assign({}, ...results), tagNames])
    .then(([itemsByAppid, tagNames]) => games.map(game => ({
      ...game,
      ...buildImageUrls(game.appid, itemsByAppid[game.appid]?.assets),
      store: buildStoreDetails(itemsByAppid[game.appid], tagNames)
    })));

const chunk = (items, size) =>
  Array.from({ length: Math.ceil(items.length / size) }, (_, i) => items.slice(i * size, (i + 1) * size));

const fetchStoreItems = (games) => {
  const input = {
    ids: games.map(({ appid }) => ({ appid })),
    context: { language: 'japanese', country_code: 'JP' },
    data_request: {
      include_assets: true,
      include_basic_info: true,
      include_tag_count: 5,
      include_reviews: true,
      include_screenshots: true,
      include_trailers: true
    }
  };

  return fetch(`https://api.steampowered.com/IStoreBrowseService/GetItems/v1/?${new URLSearchParams({ input_json: JSON.stringify(input) })}`)
    .then(response => response.json())
    .then(json => Object.fromEntries((json.response.store_items ?? []).map(item => [item.appid, item])))
    .catch(() => ({}));
};

const fetchTagNames = () =>
  fetch('https://api.steampowered.com/IStoreService/GetTagList/v1/?language=japanese')
    .then(response => response.json())
    .then(json => Object.fromEntries(json.response.tags.map(({ tagid, name }) => [tagid, name])))
    .catch(() => ({}));

const buildImageUrls = (appid, assets) => ({
  headerUrl: buildAssetUrl(assets, assets?.header) ?? `${storeAssetBaseUrl}steam/apps/${appid}/header.jpg`,
  libraryUrl: buildAssetUrl(assets, assets?.library_capsule) ?? `${storeAssetBaseUrl}steam/apps/${appid}/library_600x900.jpg`,
  capsuleUrl: buildAssetUrl(assets, assets?.main_capsule) ?? `${storeAssetBaseUrl}steam/apps/${appid}/capsule_616x353.jpg`
});

const buildStoreDetails = (item, tagNames) => ({
  shortDescription: item?.basic_info?.short_description ?? '',
  tags: (item?.tagids ?? []).map(tagid => tagNames[tagid]).filter(Boolean),
  review: item?.reviews?.summary_filtered,
  screenshotUrls: (item?.screenshots?.all_ages_screenshots ?? []).slice(0, 3)
    .map(({ filename }) => `${storeAssetBaseUrl}${filename.replace('.jpg', '.600x338.jpg')}`),
  trailerUrl: buildTrailerUrl(item?.trailers?.highlights?.[0])
});

const buildTrailerUrl = (trailer) => {
  const file = trailer?.microtrailer?.find(({ type }) => type === 'video/mp4');

  return file && `https://video.akamai.steamstatic.com/store_trailers/${file.filename}`;
};

const buildAssetUrl = (assets, filename) =>
  filename && `${storeAssetBaseUrl}${assets.asset_url_format.replace('${FILENAME}', filename)}`;

const storeAssetBaseUrl = 'https://shared.akamai.steamstatic.com/store_item_assets/';

module.exports = { attachStoreData };
