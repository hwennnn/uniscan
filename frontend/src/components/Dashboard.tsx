import { useLatestEthPriceQuery } from "../core/queries/get-latest-eth-price";

const Dashboard = () => {
  const { data: ethPrice = null } = useLatestEthPriceQuery();

  return (
    <div className="flex flex-1 items-center flex-col space-y-4 p-6 bg-gray-100 rounded-lg shadow-md">
      <h1 className="font-bold text-3xl text-blue-600">Dashboard</h1>

      {!!ethPrice && (
        <p className="text-lg text-gray-700">
          Latest ETH Price:
          <span className="ml-2 font-semibold text-green-500 inline-block w-24">
            ${ethPrice.price}
          </span>
        </p>
      )}
    </div>
  );
};

export default Dashboard;
