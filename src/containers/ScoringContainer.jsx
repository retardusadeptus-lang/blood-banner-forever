import ScoringTab from '../components/ScoringTab';

export default function ScoringContainer({ scoring, siteTabMetadata }) {
  return <ScoringTab {...scoring} siteTabMetadata={siteTabMetadata} />;
}
