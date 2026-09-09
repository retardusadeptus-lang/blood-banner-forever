import ItemsDatabaseTab from '../components/ItemsDatabaseTab';

export default function ItemsDatabaseContainer({ itemsDb, siteTabMetadata }) {
  return <ItemsDatabaseTab {...itemsDb} siteTabMetadata={siteTabMetadata} />;
}
