const Wishlist = require("../models/wishlistModel");
const Impression = require("../models/impressionsModel");
const Enquiry = require("../models/enquiryModel");

const fetchReceivedData = async (userId) => {
  // Use Promise.all to fetch data concurrently from Wishlist, Enquiry, and Impression
  const [wishlistedItems, enquiredItems, impressionItems] = await Promise.all([
    Wishlist.find({ "to.userId": userId, wishlist: true }).select(
      "patentDetails.patentId"
    ),
    Enquiry.find({ "to.userId": userId, enquire: true }).select(
      "patentDetails.patentId"
    ),
    Impression.find({ "to.userId": userId, impression: true }).select(
      "patentDetails.patentId"
    ),
  ]);

  // Extract patent IDs from results
  const wishlistedPatentIds = wishlistedItems.map(
    (item) => item.patentDetails.patentId
  );
  const enquiredPatentIds = enquiredItems.map(
    (item) => item.patentDetails.patentId
  );
  const impressionPatentIds = impressionItems.map(
    (item) => item.patentDetails.patentId
  );

  // Return data
  return {
    wishlisted: wishlistedPatentIds,
    enquired: enquiredPatentIds,
    impressions: impressionPatentIds,
  };
};

module.exports = { fetchReceivedData };
