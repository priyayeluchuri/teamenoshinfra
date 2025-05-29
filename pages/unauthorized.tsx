import { NextPage } from 'next';

const UnauthorizedPage: NextPage = () => {
  return (
        <div className="min-h-screen bg-gray-100 p-6">
            <div className="bg-white p-8 rounded-lg shadow-lg w-full">
                <h1 className="text-3xl font-bold mb-6 text-enosh-blue">Unauthorized</h1>
                <p className="text-center">Access denied.</p>
            </div>
        </div>
    );
};

export default UnauthorizedPage;
