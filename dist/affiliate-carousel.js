(() => {
  const API = "https://collshp.com/api/v3/gql/graphql";
  const CACHE_PREFIX = "affiliate-carousel:";
  const CACHE_TTL = 30 * 60 * 1000;
  const BASIC_INFO_QUERY = `query LandingPageBasicInfoV2Query($urlSuffix: String, $affiliateId: Long) {
    landingPageBasicInfoV2(urlSuffix: $urlSuffix, affiliateId: $affiliateId) {
      name affiliateId urlSuffix userId
    }
  }`;
  const PRODUCT_LIST_QUERY = `query StorefrontProductListQuery($urlSuffix: String, $sortType: SortType, $page: LinktreelandingpagePaginationInput, $affiliateMeta: AffiliateMetaInput, $cid: String, $language: String, $uuId: String, $deviceId: String) {
    storefrontProductList(urlSuffix: $urlSuffix, sortType: $sortType, page: $page, affiliateMeta: $affiliateMeta, cid: $cid, language: $language, uuId: $uuId, deviceId: $deviceId) {
      itemList { linkId link linkName image itemCard }
      pagination { hasMore totalCount }
    }
  }`;

  async function request(operationName, query, variables) {
    const response = await fetch(`${API}?q=${operationName}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ operationName, query, variables })
    });
    if (!response.ok) throw new Error(`Collshp request failed: ${response.status}`);
    const payload = await response.json();
    if (payload.errors?.length) throw new Error(payload.errors[0].message || "Collshp query failed");
    return payload.data;
  }

  function readCache(key) {
    try {
      const cached = JSON.parse(localStorage.getItem(CACHE_PREFIX + key));
      if (!cached?.items?.length) return null;
      return { ...cached, fresh: Date.now() - cached.savedAt < CACHE_TTL };
    } catch {
      return null;
    }
  }

  function writeCache(key, data) {
    try {
      localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ ...data, savedAt: Date.now() }));
    } catch {
      // Storage can be unavailable in privacy modes; live data still works.
    }
  }

  function clientIds() {
    const key = `${CACHE_PREFIX}client-id`;
    let uuid;
    try {
      uuid = localStorage.getItem(key);
      if (!uuid) {
        uuid = crypto.randomUUID();
        localStorage.setItem(key, uuid);
      }
    } catch {
      uuid = crypto.randomUUID();
    }
    return { uuId: uuid, deviceId: uuid.replaceAll("-", "").toUpperCase() };
  }

  function formatPrice(rawPrice) {
    const value = Number(rawPrice) / 100000;
    return Number.isFinite(value) ? `$${Math.round(value).toLocaleString("zh-TW")}` : "";
  }

  function normalizeItem(item) {
    const asset = item.itemCard?.itemCardDisplayedAsset;
    return {
      id: item.linkId,
      name: item.linkName || asset?.name || "推薦商品",
      url: item.link,
      image: item.image || asset?.image,
      price: formatPrice(asset?.displayPrice?.price),
      sold: asset?.soldCount?.text || "",
      discount: asset?.discountTag?.discountText || ""
    };
  }

  async function loadProducts(suffix, limit) {
    const cached = readCache(suffix);
    if (cached?.fresh) return cached;

    try {
      const basicData = await request("LandingPageBasicInfoV2Query", BASIC_INFO_QUERY, { urlSuffix: suffix });
      const profile = basicData.landingPageBasicInfoV2;
      if (!profile?.affiliateId || !profile?.userId) throw new Error("Affiliate profile is unavailable");
      const productData = await request("StorefrontProductListQuery", PRODUCT_LIST_QUERY, {
        urlSuffix: suffix,
        affiliateMeta: { affiliateId: profile.affiliateId, userId: profile.userId },
        ...clientIds(),
        cid: "tw",
        language: "zh-Hant",
        page: { offset: "0", limit: String(limit), hasMore: false, totalCount: "0" },
        sortType: "ITEM_POPULAR"
      });
      const items = (productData.storefrontProductList?.itemList || [])
        .map(normalizeItem)
        .filter(item => item.url && item.image);
      if (!items.length) throw new Error("No affiliate products returned");
      const result = { items, profileName: profile.name || "推薦商品" };
      writeCache(suffix, result);
      return result;
    } catch (error) {
      if (cached) return { ...cached, stale: true };
      throw error;
    }
  }

  function createProductCard(item) {
    const article = document.createElement("article");
    article.className = "affiliate-product";
    article.setAttribute("role", "listitem");

    const link = document.createElement("a");
    link.href = item.url;
    link.target = "_blank";
    link.rel = "sponsored noopener noreferrer";
    link.setAttribute("aria-label", `${item.name}，將在新分頁開啟`);

    const media = document.createElement("div");
    media.className = "affiliate-product-media";
    const image = document.createElement("img");
    image.src = item.image;
    image.alt = item.name;
    image.loading = "lazy";
    image.decoding = "async";
    media.append(image);
    if (item.discount) {
      const discount = document.createElement("span");
      discount.className = "affiliate-discount";
      discount.textContent = item.discount;
      media.append(discount);
    }

    const body = document.createElement("div");
    body.className = "affiliate-product-body";
    const title = document.createElement("p");
    title.className = "affiliate-product-title";
    title.textContent = item.name;
    const meta = document.createElement("div");
    meta.className = "affiliate-product-meta";
    const price = document.createElement("span");
    price.className = "affiliate-price";
    price.textContent = item.price;
    const sold = document.createElement("span");
    sold.className = "affiliate-sold";
    sold.textContent = item.sold;
    meta.append(price, sold);
    body.append(title, meta);
    link.append(media, body);
    article.append(link);
    return article;
  }

  function setupCarousel(root, items) {
    const track = root.querySelector("[data-affiliate-track]");
    const previous = root.querySelector("[data-affiliate-prev]");
    const next = root.querySelector("[data-affiliate-next]");
    track.replaceChildren(...items.map(createProductCard));

    const step = () => {
      const card = track.querySelector(".affiliate-product");
      return card ? card.getBoundingClientRect().width + 14 : track.clientWidth;
    };
    const updateControls = () => {
      previous.disabled = track.scrollLeft <= 2;
      next.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 2;
    };
    const move = direction => {
      if (direction > 0 && next.disabled) track.scrollTo({ left: 0, behavior: "smooth" });
      else track.scrollBy({ left: direction * step(), behavior: "smooth" });
    };
    previous.addEventListener("click", () => move(-1));
    next.addEventListener("click", () => move(1));
    track.addEventListener("scroll", updateControls, { passive: true });
    window.addEventListener("resize", updateControls, { passive: true });
    updateControls();

    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      let timer;
      const stop = () => window.clearInterval(timer);
      const start = () => {
        stop();
        timer = window.setInterval(() => move(1), 5000);
      };
      root.addEventListener("mouseenter", stop);
      root.addEventListener("mouseleave", start);
      root.addEventListener("focusin", stop);
      root.addEventListener("focusout", start);
      document.addEventListener("visibilitychange", () => document.hidden ? stop() : start());
      start();
    }
  }

  async function initialize(root) {
    const status = root.querySelector("[data-affiliate-status]");
    const storefrontUrl = root.dataset.storefrontUrl;
    const limit = Math.max(4, Math.min(20, Number(root.dataset.limit) || 12));
    try {
      const suffix = new URL(storefrontUrl).pathname.split("/").filter(Boolean)[0];
      if (!suffix) throw new Error("Invalid storefront URL");
      const result = await loadProducts(suffix, limit);
      setupCarousel(root, result.items);
      if (result.stale) {
        status.textContent = "目前顯示最近一次成功同步的推薦商品。";
      } else {
        status.hidden = true;
      }
    } catch (error) {
      console.warn("Affiliate carousel unavailable", error);
      status.textContent = "推薦商品暫時無法載入，請使用下方連結查看完整分享池。";
    }
  }

  document.querySelectorAll("[data-affiliate-carousel]").forEach(initialize);
})();
