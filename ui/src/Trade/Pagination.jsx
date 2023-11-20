export const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  const maxPagesToShow = 5;

  const pageNumbersToShow = () => {
    const pages = [];
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, currentPage + 2);

    if (currentPage <= 3) {
      endPage = Math.min(maxPagesToShow, totalPages);
    }
    if (currentPage > totalPages - 3) {
      startPage = Math.max(totalPages - maxPagesToShow + 1, 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  };

  return (
    <div className="flex justify-center items-center space-x-2">
      <button
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="text-gray-600"
      >
        Previous
      </button>
      {currentPage > 3 && <span className="text-gray-600">...</span>}
      {pageNumbersToShow().map((number) => (
        <button
          key={number}
          className={`${currentPage === number ? 'text-blue-600' : 'text-gray-600'}`}
          onClick={() => onPageChange(number)}
        >
          {number}
        </button>
      ))}
      {currentPage < totalPages - 2 && <span className="text-gray-600">...</span>}
      <button
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className="text-gray-600"
      >
        Next
      </button>
    </div>
  );
};
