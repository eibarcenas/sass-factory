"""Application errors raised by use cases, adapted at the presentation edge."""


class ApplicationError(Exception):
    def __init__(self, status_code: int, detail):
        self.status_code = status_code
        self.detail = detail
        super().__init__(str(detail))


class BadRequestError(ApplicationError):
    def __init__(self, detail):
        super().__init__(400, detail)


class NotFoundError(ApplicationError):
    def __init__(self, detail):
        super().__init__(404, detail)


class ConflictError(ApplicationError):
    def __init__(self, detail):
        super().__init__(409, detail)


class InvalidTransitionError(ApplicationError):
    def __init__(self, detail):
        super().__init__(422, detail)
